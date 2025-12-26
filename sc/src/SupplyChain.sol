// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SupplyChain
 * @notice Smart contract para trazabilidad en supply chain con gestión de roles, tokens y transferencias
 */
contract SupplyChain {
    // ========== ENUMS ==========

    enum UserStatus {
        Pending,    // Usuario registrado, esperando aprobación
        Approved,   // Usuario aprobado, puede operar
        Rejected,   // Usuario rechazado por admin
        Canceled    // Usuario cancelado
    }

    enum TransferStatus {
        Pending,   // Transferencia pendiente de aceptación
        Accepted,  // Transferencia aceptada
        Rejected   // Transferencia rechazada
    }

    // ========== STRUCTS ==========

    struct User {
        uint256 id;
        address userAddress;
        string role; // "PRODUCER", "FACTORY", "RETAILER", "CONSUMER", "ADMIN"
        UserStatus status;
    }

    struct Token {
        uint256 id;
        address creator;
        string name;
        uint256 totalSupply;
        string features; // JSON con metadata del token
        uint256 parentId; // 0 si no tiene parent, >0 si deriva de otro token
        uint256 dateCreated;
        // NOTA: mapping de balances NO puede estar aquí por limitaciones de Solidity
        // Se maneja en un mapping separado: tokenBalances[tokenId][userAddress]
    }

    struct Transfer {
        uint256 id;
        address from;
        address to;
        uint256 tokenId;
        uint256 dateCreated;
        uint256 amount;
        TransferStatus status;
    }

    // ========== STATE VARIABLES ==========

    address public admin;

    // Contadores
    uint256 public nextTokenId = 1;
    uint256 public nextTransferId = 1;
    uint256 public nextUserId = 1;

    // Mappings principales
    mapping(uint256 => Token) public tokens;
    mapping(uint256 => Transfer) public transfers;
    mapping(uint256 => User) public users;
    mapping(address => uint256) public addressToUserId;

    // Mapping de balances de tokens: tokenId => userAddress => balance
    mapping(uint256 => mapping(address => uint256)) private tokenBalances;

    // Mappings auxiliares para búsquedas eficientes
    mapping(address => uint256[]) private userTokenIds; // tokens que posee un usuario
    mapping(address => uint256[]) private userTransferIds; // transferencias de un usuario

    // ========== EVENTS ==========

    event TokenCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        uint256 totalSupply,
        uint256 parentId
    );

    event TransferRequested(
        uint256 indexed transferId,
        address indexed from,
        address indexed to,
        uint256 tokenId,
        uint256 amount
    );

    event TransferAccepted(
        uint256 indexed transferId,
        address indexed from,
        address indexed to,
        uint256 tokenId,
        uint256 amount
    );

    event TransferRejected(
        uint256 indexed transferId,
        address indexed from,
        address indexed to,
        uint256 tokenId
    );

    event UserRoleRequested(
        uint256 indexed userId,
        address indexed userAddress,
        string role
    );

    event UserStatusChanged(
        uint256 indexed userId,
        address indexed userAddress,
        UserStatus newStatus
    );

    // ========== MODIFIERS ==========

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyApproved() {
        uint256 userId = addressToUserId[msg.sender];
        require(userId != 0, "User not registered");
        require(users[userId].status == UserStatus.Approved, "User not approved");
        _;
    }

    // ========== CONSTRUCTOR ==========

    constructor() {
        admin = msg.sender;

        // Registrar admin automáticamente
        users[nextUserId] = User({
            id: nextUserId,
            userAddress: admin,
            role: "ADMIN",
            status: UserStatus.Approved
        });
        addressToUserId[admin] = nextUserId;
        nextUserId++;

        emit UserRoleRequested(1, admin, "ADMIN");
        emit UserStatusChanged(1, admin, UserStatus.Approved);
    }

    // ========== USER MANAGEMENT FUNCTIONS ==========

    /**
     * @notice Permite a un usuario solicitar un rol en el sistema
     * @param role Rol solicitado: "PRODUCER", "FACTORY", "RETAILER", "CONSUMER"
     */
    function requestUserRole(string memory role) public {
        require(addressToUserId[msg.sender] == 0, "User already registered");

        uint256 userId = nextUserId++;

        users[userId] = User({
            id: userId,
            userAddress: msg.sender,
            role: role,
            status: UserStatus.Pending
        });

        addressToUserId[msg.sender] = userId;

        emit UserRoleRequested(userId, msg.sender, role);
    }

    /**
     * @notice Permite al admin cambiar el estado de un usuario (Aprobar/Rechazar/Cancelar)
     * @param userAddress Dirección del usuario a modificar
     * @param newStatus Nuevo estado del usuario
     * @dev Validaciones de transición de estados:
     *      - Pending -> Approved o Rejected
     *      - Approved -> Canceled
     *      - Rejected -> Approved o Canceled
     *      - Canceled -> Approved
     */
    function changeStatusUser(address userAddress, UserStatus newStatus) public onlyAdmin {
        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "User not found");

        // El admin no puede cambiar su propio estado
        require(userAddress != admin, "Admin cannot change their own status");

        UserStatus currentStatus = users[userId].status;

        // Validar transiciones permitidas
        if (currentStatus == UserStatus.Pending) {
            require(
                newStatus == UserStatus.Approved || newStatus == UserStatus.Rejected,
                "From Pending: can only change to Approved or Rejected"
            );
        } else if (currentStatus == UserStatus.Approved) {
            require(
                newStatus == UserStatus.Canceled,
                "From Approved: can only change to Canceled"
            );
        } else if (currentStatus == UserStatus.Rejected) {
            require(
                newStatus == UserStatus.Approved || newStatus == UserStatus.Canceled,
                "From Rejected: can only change to Approved or Canceled"
            );
        } else if (currentStatus == UserStatus.Canceled) {
            require(
                newStatus == UserStatus.Approved,
                "From Canceled: can only change to Approved"
            );
        }

        users[userId].status = newStatus;

        emit UserStatusChanged(userId, userAddress, newStatus);
    }

    /**
     * @notice Obtiene la información completa de un usuario
     * @param userAddress Dirección del usuario
     * @return User Información del usuario
     */
    function getUserInfo(address userAddress) public view returns (User memory) {
        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "User not found");
        return users[userId];
    }

    /**
     * @notice Verifica si una dirección es el admin
     * @param userAddress Dirección a verificar
     * @return bool True si es admin, false si no
     */
    function isAdmin(address userAddress) public view returns (bool) {
        uint256 userId = addressToUserId[userAddress];
        if (userId == 0) return false;
        return keccak256(bytes(users[userId].role)) == keccak256(bytes("ADMIN"));
    }

    // ========== TOKEN MANAGEMENT FUNCTIONS ==========

    /**
     * @notice Crea un nuevo token
     * @param name Nombre del token
     * @param totalSupply Cantidad total de tokens a crear
     * @param features Metadata en formato JSON
     * @param parentId ID del token padre (0 si no tiene)
     * @param amountConsumed Cantidad del token padre que se consume para crear este token
     * @dev Flujo de trabajo en supply chain:
     *      1. PRODUCER: Crea tokens originales (parentId = 0) de materia prima
     *      2. FACTORY: Recibe materia prima, crea tokens derivados consumiendo del padre
     *      3. RETAILER: Recibe producto procesado, crea tokens derivados consumiendo del padre
     *      4. CONSUMER: Solo recibe, no crea tokens
     *      Cada eslabón solo puede transferir tokens que él mismo creó, forzando la transformación
     *      Al crear un token derivado, se consume la cantidad especificada del token padre
     */
    function createToken(
        string memory name,
        uint256 totalSupply,
        string memory features,
        uint256 parentId,
        uint256 amountConsumed
    ) public onlyApproved {
        require(totalSupply > 0, "Total supply must be greater than 0");

        // Validaciones según el rol en la cadena de suministro
        uint256 userId = addressToUserId[msg.sender];
        bytes32 roleHash = keccak256(bytes(users[userId].role));

        // PRODUCER: Solo puede crear tokens originales (primer eslabón)
        if (roleHash == keccak256(bytes("PRODUCER"))) {
            require(parentId == 0, "Producers can only create original tokens");
            require(amountConsumed == 0, "Producers cannot consume tokens when creating");
        }

        // FACTORY y RETAILER: Solo pueden crear tokens derivados (deben transformar materia prima)
        if (roleHash == keccak256(bytes("FACTORY")) || roleHash == keccak256(bytes("RETAILER"))) {
            require(parentId > 0, "Factories and retailers must create derived tokens from existing materials");
            require(amountConsumed > 0, "Must specify how many parent tokens to consume");
        }

        // Si hay parentId, validar que existe y consumir tokens
        if (parentId != 0) {
            require(tokens[parentId].id != 0, "Parent token does not exist");
            require(amountConsumed > 0, "Must consume at least 1 token from parent");
            require(tokenBalances[parentId][msg.sender] >= amountConsumed, "Insufficient parent token balance");

            // Consumir tokens del padre
            tokenBalances[parentId][msg.sender] -= amountConsumed;
        } else {
            require(amountConsumed == 0, "Cannot consume tokens when creating original token");
        }

        uint256 tokenId = nextTokenId++;

        tokens[tokenId] = Token({
            id: tokenId,
            creator: msg.sender,
            name: name,
            totalSupply: totalSupply,
            features: features,
            parentId: parentId,
            dateCreated: block.timestamp
        });

        // Asignar todo el supply al creador
        tokenBalances[tokenId][msg.sender] = totalSupply;

        // Agregar token a la lista del usuario
        userTokenIds[msg.sender].push(tokenId);

        emit TokenCreated(tokenId, msg.sender, name, totalSupply, parentId);
    }

    /**
     * @notice Obtiene información de un token
     * @param tokenId ID del token
     * @return Token Información del token
     */
    function getToken(uint256 tokenId) public view returns (Token memory) {
        require(tokens[tokenId].id != 0, "Token does not exist");
        return tokens[tokenId];
    }

    /**
     * @notice Obtiene el balance de un token para un usuario
     * @param tokenId ID del token
     * @param userAddress Dirección del usuario
     * @return uint256 Balance del token
     */
    function getTokenBalance(uint256 tokenId, address userAddress) public view returns (uint256) {
        require(tokens[tokenId].id != 0, "Token does not exist");
        return tokenBalances[tokenId][userAddress];
    }

    // ========== TRANSFER FUNCTIONS ==========

    /**
     * @notice Solicita una transferencia de tokens a otro usuario
     * @param to Dirección del receptor
     * @param tokenId ID del token a transferir
     * @param amount Cantidad a transferir
     * @dev Solo el creador del token puede transferirlo. Esto fuerza la transformación en cada eslabón:
     *      - Producer crea y transfiere materia prima
     *      - Factory debe crear nuevo token derivado (producto procesado) para transferir
     *      - Retailer debe crear nuevo token derivado (producto empacado) para transferir
     */
    function transfer(address to, uint256 tokenId, uint256 amount) public onlyApproved {
        require(tokens[tokenId].id != 0, "Token does not exist");
        require(to != msg.sender, "Cannot transfer to yourself");
        require(amount > 0, "Amount must be greater than 0");
        require(tokenBalances[tokenId][msg.sender] >= amount, "Insufficient balance");

        // Solo el creador del token puede transferirlo
        require(tokens[tokenId].creator == msg.sender, "Only token creator can transfer it");

        // Verificar que el receptor esté aprobado
        uint256 toUserId = addressToUserId[to];
        require(toUserId != 0, "Recipient not registered");
        require(users[toUserId].status == UserStatus.Approved, "User not approved");

        // Validar flujo de roles: Producer → Factory → Retailer → Consumer
        uint256 fromUserId = addressToUserId[msg.sender];
        _validateRoleTransfer(users[fromUserId].role, users[toUserId].role);

        uint256 transferId = nextTransferId++;

        transfers[transferId] = Transfer({
            id: transferId,
            from: msg.sender,
            to: to,
            tokenId: tokenId,
            dateCreated: block.timestamp,
            amount: amount,
            status: TransferStatus.Pending
        });

        // Agregar a las listas de transferencias de ambos usuarios
        userTransferIds[msg.sender].push(transferId);
        userTransferIds[to].push(transferId);

        emit TransferRequested(transferId, msg.sender, to, tokenId, amount);
    }

    /**
     * @notice Acepta una transferencia pendiente
     * @param transferId ID de la transferencia
     */
    function acceptTransfer(uint256 transferId) public {
        require(transfers[transferId].id != 0, "Transfer does not exist");
        Transfer storage txf = transfers[transferId];

        require(msg.sender == txf.to, "Only recipient can accept");
        require(txf.status == TransferStatus.Pending, "Transfer not pending");

        // Actualizar estado
        txf.status = TransferStatus.Accepted;

        // Transferir tokens
        tokenBalances[txf.tokenId][txf.from] -= txf.amount;
        tokenBalances[txf.tokenId][txf.to] += txf.amount;

        // Si el receptor no tenía este token, agregarlo a su lista
        if (tokenBalances[txf.tokenId][txf.to] == txf.amount) {
            userTokenIds[txf.to].push(txf.tokenId);
        }

        emit TransferAccepted(transferId, txf.from, txf.to, txf.tokenId, txf.amount);
    }

    /**
     * @notice Rechaza una transferencia pendiente
     * @param transferId ID de la transferencia
     */
    function rejectTransfer(uint256 transferId) public {
        require(transfers[transferId].id != 0, "Transfer does not exist");
        Transfer storage txf = transfers[transferId];

        require(msg.sender == txf.to, "Only recipient can reject");
        require(txf.status == TransferStatus.Pending, "Transfer not pending");

        // Actualizar estado
        txf.status = TransferStatus.Rejected;

        emit TransferRejected(transferId, txf.from, txf.to, txf.tokenId);
    }

    /**
     * @notice Obtiene información de una transferencia
     * @param transferId ID de la transferencia
     * @return Transfer Información de la transferencia
     */
    function getTransfer(uint256 transferId) public view returns (Transfer memory) {
        require(transfers[transferId].id != 0, "Transfer does not exist");
        return transfers[transferId];
    }

    // ========== AUXILIARY FUNCTIONS ==========

    /**
     * @notice Obtiene todos los tokens que posee un usuario (con balance > 0)
     * @param userAddress Dirección del usuario
     * @return uint256[] Array de IDs de tokens
     */
    function getUserTokens(address userAddress) public view returns (uint256[] memory) {
        return userTokenIds[userAddress];
    }

    /**
     * @notice Obtiene todas las transferencias de un usuario (enviadas o recibidas)
     * @param userAddress Dirección del usuario
     * @return uint256[] Array de IDs de transferencias
     */
    function getUserTransfers(address userAddress) public view returns (uint256[] memory) {
        return userTransferIds[userAddress];
    }

    // ========== INTERNAL HELPER FUNCTIONS ==========

    /**
     * @notice Valida que la transferencia siga el flujo correcto de roles
     * @dev Producer → Factory → Retailer → Consumer (flujo unidireccional)
     * @param fromRole Rol del remitente
     * @param toRole Rol del destinatario
     */
    function _validateRoleTransfer(string memory fromRole, string memory toRole) internal pure {
        bytes32 fromRoleHash = keccak256(bytes(fromRole));
        bytes32 toRoleHash = keccak256(bytes(toRole));

        bytes32 PRODUCER = keccak256(bytes("PRODUCER"));
        bytes32 FACTORY = keccak256(bytes("FACTORY"));
        bytes32 RETAILER = keccak256(bytes("RETAILER"));
        bytes32 CONSUMER = keccak256(bytes("CONSUMER"));

        // CONSUMER no puede transferir
        require(fromRoleHash != CONSUMER, "Consumer cannot transfer tokens");

        // Validar transiciones permitidas
        if (fromRoleHash == PRODUCER) {
            require(toRoleHash == FACTORY, "Invalid transfer: PRODUCER can only transfer to FACTORY");
        } else if (fromRoleHash == FACTORY) {
            require(toRoleHash == RETAILER, "Invalid transfer: FACTORY can only transfer to RETAILER");
        } else if (fromRoleHash == RETAILER) {
            require(toRoleHash == CONSUMER, "Invalid transfer: RETAILER can only transfer to CONSUMER");
        }
        // ADMIN puede transferir a cualquiera (no hay restricción)
    }
}
