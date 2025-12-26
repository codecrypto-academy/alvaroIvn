// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SupplyChain.sol";

contract SupplyChainTest is Test {
    SupplyChain public supplyChain;

    // Eventos (para testing)
    event UserRoleRequested(uint256 indexed userId, address indexed userAddress, string role);
    event UserStatusChanged(uint256 indexed userId, address indexed userAddress, SupplyChain.UserStatus newStatus);
    event TokenCreated(uint256 indexed tokenId, address indexed creator, string name, uint256 totalSupply, uint256 parentId);
    event TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount);
    event TransferAccepted(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount);
    event TransferRejected(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId);

    // Direcciones de prueba
    address public admin;
    address public producer1;
    address public producer2;
    address public factory1;
    address public factory2;
    address public retailer1;
    address public retailer2;
    address public consumer1;
    address public consumer2;

    function setUp() public {
        // Crear direcciones únicas para cada actor
        admin = address(this); // El contrato de test es el admin
        producer1 = makeAddr("producer1");
        producer2 = makeAddr("producer2");
        factory1 = makeAddr("factory1");
        factory2 = makeAddr("factory2");
        retailer1 = makeAddr("retailer1");
        retailer2 = makeAddr("retailer2");
        consumer1 = makeAddr("consumer1");
        consumer2 = makeAddr("consumer2");

        // Desplegar contrato
        supplyChain = new SupplyChain();
    }

    // ========== HELPER FUNCTIONS ==========

    function registerAndApproveUser(address user, string memory role) internal {
        vm.prank(user);
        supplyChain.requestUserRole(role);

        vm.prank(admin);
        supplyChain.changeStatusUser(user, SupplyChain.UserStatus.Approved);
    }

    // ========== USER MANAGEMENT TESTS ==========

    function testAdminIsRegisteredOnDeploy() public view {
        SupplyChain.User memory adminUser = supplyChain.getUserInfo(admin);
        assertEq(adminUser.id, 1);
        assertEq(adminUser.userAddress, admin);
        assertEq(adminUser.role, "ADMIN");
        assertTrue(adminUser.status == SupplyChain.UserStatus.Approved);
    }

    function testIsAdmin() public view {
        assertTrue(supplyChain.isAdmin(admin));
        assertFalse(supplyChain.isAdmin(producer1));
    }

    function testUserRegistration() public {
        vm.expectEmit(true, true, false, true);
        emit UserRoleRequested(2, producer1, "PRODUCER");

        vm.prank(producer1);
        supplyChain.requestUserRole("PRODUCER");

        SupplyChain.User memory user = supplyChain.getUserInfo(producer1);
        assertEq(user.id, 2);
        assertEq(user.userAddress, producer1);
        assertEq(user.role, "PRODUCER");
        assertTrue(user.status == SupplyChain.UserStatus.Pending);
    }

    function testCannotRegisterTwice() public {
        vm.startPrank(producer1);
        supplyChain.requestUserRole("PRODUCER");

        vm.expectRevert("User already registered");
        supplyChain.requestUserRole("PRODUCER");
        vm.stopPrank();
    }

    function testAdminApproveUser() public {
        vm.prank(producer1);
        supplyChain.requestUserRole("PRODUCER");

        vm.expectEmit(true, true, false, true);
        emit UserStatusChanged(2, producer1, SupplyChain.UserStatus.Approved);

        vm.prank(admin);
        supplyChain.changeStatusUser(producer1, SupplyChain.UserStatus.Approved);

        SupplyChain.User memory user = supplyChain.getUserInfo(producer1);
        assertTrue(user.status == SupplyChain.UserStatus.Approved);
    }

    function testAdminRejectUser() public {
        vm.prank(producer1);
        supplyChain.requestUserRole("PRODUCER");

        vm.prank(admin);
        supplyChain.changeStatusUser(producer1, SupplyChain.UserStatus.Rejected);

        SupplyChain.User memory user = supplyChain.getUserInfo(producer1);
        assertTrue(user.status == SupplyChain.UserStatus.Rejected);
    }

    function testOnlyAdminCanChangeStatus() public {
        vm.prank(producer1);
        supplyChain.requestUserRole("PRODUCER");

        vm.prank(producer2);
        vm.expectRevert("Only admin can perform this action");
        supplyChain.changeStatusUser(producer1, SupplyChain.UserStatus.Approved);
    }

    function testCannotChangeStatusOfNonExistentUser() public {
        vm.prank(admin);
        vm.expectRevert("User not found");
        supplyChain.changeStatusUser(producer1, SupplyChain.UserStatus.Approved);
    }

    function testGetUserInfoNonExistent() public {
        vm.expectRevert("User not found");
        supplyChain.getUserInfo(producer1);
    }

    // ========== TOKEN MANAGEMENT TESTS ==========

    function testCreateTokenByProducer() public {
        registerAndApproveUser(producer1, "PRODUCER");

        vm.expectEmit(true, true, false, true);
        emit TokenCreated(1, producer1, "Tomate Organico", 1000, 0);

        vm.prank(producer1);
        supplyChain.createToken("Tomate Organico", 1000, '{"origin": "Ecuador"}', 0, 0);

        SupplyChain.Token memory token = supplyChain.getToken(1);
        assertEq(token.id, 1);
        assertEq(token.creator, producer1);
        assertEq(token.name, "Tomate Organico");
        assertEq(token.totalSupply, 1000);
        assertEq(token.features, '{"origin": "Ecuador"}');
        assertEq(token.parentId, 0);
        assertGt(token.dateCreated, 0);
    }

    function testUnapprovedUserCannotCreateToken() public {
        vm.prank(producer1);
        supplyChain.requestUserRole("PRODUCER");

        vm.prank(producer1);
        vm.expectRevert("User not approved");
        supplyChain.createToken("Tomate", 100, "{}", 0, 0);
    }

    function testUnregisteredUserCannotCreateToken() public {
        vm.prank(producer1);
        vm.expectRevert("User not registered");
        supplyChain.createToken("Tomate", 100, "{}", 0, 0);
    }

    function testTokenBalance() public {
        registerAndApproveUser(producer1, "PRODUCER");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        uint256 balance = supplyChain.getTokenBalance(1, producer1);
        assertEq(balance, 1000);
    }

    function testGetTokenBalanceOtherUser() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        uint256 balance = supplyChain.getTokenBalance(1, factory1);
        assertEq(balance, 0);
    }

    function testGetUserTokens() public {
        registerAndApproveUser(producer1, "PRODUCER");

        vm.startPrank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);
        supplyChain.createToken("Lechuga", 500, "{}", 0, 0);
        vm.stopPrank();

        uint256[] memory tokens = supplyChain.getUserTokens(producer1);
        assertEq(tokens.length, 2);
        assertEq(tokens[0], 1);
        assertEq(tokens[1], 2);
    }

    function testGetTokenNonExistent() public {
        vm.expectRevert("Token does not exist");
        supplyChain.getToken(999);
    }

    function testGetTokenBalanceNonExistent() public {
        registerAndApproveUser(producer1, "PRODUCER");

        vm.expectRevert("Token does not exist");
        supplyChain.getTokenBalance(999, producer1);
    }

    function testCreatorReceivesTotalSupply() public {
        registerAndApproveUser(producer1, "PRODUCER");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 5000, "{}", 0, 0);

        uint256 balance = supplyChain.getTokenBalance(1, producer1);
        assertEq(balance, 5000);
    }

    // ========== PARENT TOKEN TESTS ==========

    function testCreateTokenWithParent() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        // Producer crea token original
        vm.prank(producer1);
        supplyChain.createToken("Tomate Crudo", 1000, '{"type": "raw"}', 0, 0);

        // Transferir al factory para que pueda consumir
        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        // Factory crea token derivado
        vm.prank(factory1);
        supplyChain.createToken("Salsa de Tomate", 500, '{"type": "processed"}', 1, 400);

        SupplyChain.Token memory childToken = supplyChain.getToken(2);
        assertEq(childToken.parentId, 1);
        assertEq(childToken.creator, factory1);
    }

    function testCannotCreateTokenWithInvalidParent() public {
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(factory1);
        vm.expectRevert("Parent token does not exist");
        supplyChain.createToken("Salsa", 100, "{}", 999, 50);
    }

    function testTokenMetadata() public {
        registerAndApproveUser(producer1, "PRODUCER");

        string memory metadata = '{"origin": "Ecuador", "organic": true, "harvest_date": "2024-01-15"}';

        vm.prank(producer1);
        supplyChain.createToken("Tomate Organico", 1000, metadata, 0, 0);

        SupplyChain.Token memory token = supplyChain.getToken(1);
        assertEq(token.features, metadata);
    }

    function testCannotCreateTokenWithZeroSupply() public {
        registerAndApproveUser(producer1, "PRODUCER");

        vm.prank(producer1);
        vm.expectRevert("Total supply must be greater than 0");
        supplyChain.createToken("Tomate", 0, "{}", 0, 0);
    }

    // ========== TRANSFER BASIC TESTS ==========

    function testTransferFromProducerToFactory() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        // Producer crea token
        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        // Producer solicita transferencia a Factory
        vm.expectEmit(true, true, true, true);
        emit TransferRequested(1, producer1, factory1, 1, 500);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);

        // Verificar que la transferencia se creó en estado Pending
        SupplyChain.Transfer memory txf = supplyChain.getTransfer(1);
        assertEq(txf.id, 1);
        assertEq(txf.from, producer1);
        assertEq(txf.to, factory1);
        assertEq(txf.tokenId, 1);
        assertEq(txf.amount, 500);
        assertTrue(txf.status == SupplyChain.TransferStatus.Pending);
        assertGt(txf.dateCreated, 0);

        // Balances NO cambian hasta que se acepta
        assertEq(supplyChain.getTokenBalance(1, producer1), 1000);
        assertEq(supplyChain.getTokenBalance(1, factory1), 0);
    }

    function testTransferInsufficientBalance() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 100, "{}", 0, 0);

        vm.prank(producer1);
        vm.expectRevert("Insufficient balance");
        supplyChain.transfer(factory1, 1, 200);
    }

    function testTransferToSameAddress() public {
        registerAndApproveUser(producer1, "PRODUCER");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 100, "{}", 0, 0);

        vm.prank(producer1);
        vm.expectRevert("Cannot transfer to yourself");
        supplyChain.transfer(producer1, 1, 50);
    }

    function testTransferZeroAmount() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 100, "{}", 0, 0);

        vm.prank(producer1);
        vm.expectRevert("Amount must be greater than 0");
        supplyChain.transfer(factory1, 1, 0);
    }

    function testTransferNonExistentToken() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        vm.expectRevert("Token does not exist");
        supplyChain.transfer(factory1, 999, 100);
    }

    function testUnapprovedUserCannotTransfer() public {
        registerAndApproveUser(producer1, "PRODUCER");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 100, "{}", 0, 0);

        // factory1 no está aprobado
        vm.prank(factory1);
        supplyChain.requestUserRole("FACTORY");

        vm.prank(producer1);
        vm.expectRevert("User not approved");
        supplyChain.transfer(factory1, 1, 50);
    }

    function testGetTransferNonExistent() public {
        vm.expectRevert("Transfer does not exist");
        supplyChain.getTransfer(999);
    }

    // ========== ACCEPT/REJECT TRANSFER TESTS ==========

    function testAcceptTransfer() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);

        // Factory acepta la transferencia
        vm.expectEmit(true, true, true, true);
        emit TransferAccepted(1, producer1, factory1, 1, 500);

        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        // Verificar estado de la transferencia
        SupplyChain.Transfer memory txf = supplyChain.getTransfer(1);
        assertTrue(txf.status == SupplyChain.TransferStatus.Accepted);

        // Verificar balances actualizados
        assertEq(supplyChain.getTokenBalance(1, producer1), 500);
        assertEq(supplyChain.getTokenBalance(1, factory1), 500);
    }

    function testRejectTransfer() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);

        // Factory rechaza la transferencia
        vm.expectEmit(true, true, true, true);
        emit TransferRejected(1, producer1, factory1, 1);

        vm.prank(factory1);
        supplyChain.rejectTransfer(1);

        // Verificar estado de la transferencia
        SupplyChain.Transfer memory txf = supplyChain.getTransfer(1);
        assertTrue(txf.status == SupplyChain.TransferStatus.Rejected);

        // Balances no cambiaron
        assertEq(supplyChain.getTokenBalance(1, producer1), 1000);
        assertEq(supplyChain.getTokenBalance(1, factory1), 0);
    }

    function testAcceptNonExistentTransfer() public {
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(factory1);
        vm.expectRevert("Transfer does not exist");
        supplyChain.acceptTransfer(999);
    }

    function testOnlyRecipientCanAccept() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);

        // Producer intenta aceptar su propia transferencia
        vm.prank(producer1);
        vm.expectRevert("Only recipient can accept");
        supplyChain.acceptTransfer(1);
    }

    function testOnlyRecipientCanReject() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);

        // Producer intenta rechazar
        vm.prank(producer1);
        vm.expectRevert("Only recipient can reject");
        supplyChain.rejectTransfer(1);
    }

    function testCannotAcceptAlreadyAcceptedTransfer() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);

        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        // Intentar aceptar de nuevo
        vm.prank(factory1);
        vm.expectRevert("Transfer not pending");
        supplyChain.acceptTransfer(1);
    }

    function testCannotAcceptRejectedTransfer() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);

        vm.prank(factory1);
        supplyChain.rejectTransfer(1);

        // Intentar aceptar después de rechazar
        vm.prank(factory1);
        vm.expectRevert("Transfer not pending");
        supplyChain.acceptTransfer(1);
    }

    function testFactoryReceivesTokensInUserTokensList() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);

        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        // Verificar que factory1 ahora tiene el token en su lista
        uint256[] memory factoryTokens = supplyChain.getUserTokens(factory1);
        assertEq(factoryTokens.length, 1);
        assertEq(factoryTokens[0], 1);
    }

    // ========== ROLE FLOW VALIDATION TESTS ==========

    function testTransferFromFactoryToRetailer() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");
        registerAndApproveUser(retailer1, "RETAILER");

        // Producer → Factory
        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);

        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        // Factory crea producto derivado consumiendo tomate
        vm.prank(factory1);
        supplyChain.createToken("Salsa de Tomate", 300, "{}", 1, 400);

        // Factory → Retailer con su propio token creado (debe ser válido)
        vm.prank(factory1);
        supplyChain.transfer(retailer1, 2, 200);

        vm.prank(retailer1);
        supplyChain.acceptTransfer(2);

        assertEq(supplyChain.getTokenBalance(2, retailer1), 200);
    }

    function testTransferFromRetailerToConsumer() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");
        registerAndApproveUser(retailer1, "RETAILER");
        registerAndApproveUser(consumer1, "CONSUMER");

        // Producer crea y transfiere a Factory
        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        // Factory crea producto derivado y transfiere a Retailer
        vm.prank(factory1);
        supplyChain.createToken("Salsa de Tomate", 300, "{}", 1, 400);

        vm.prank(factory1);
        supplyChain.transfer(retailer1, 2, 200);
        vm.prank(retailer1);
        supplyChain.acceptTransfer(2);

        // Retailer crea paquetes y transfiere a Consumer
        vm.prank(retailer1);
        supplyChain.createToken("Paquetes de Salsa", 50, "{}", 2, 150);

        vm.prank(retailer1);
        supplyChain.transfer(consumer1, 3, 30);

        vm.prank(consumer1);
        supplyChain.acceptTransfer(3);

        assertEq(supplyChain.getTokenBalance(3, consumer1), 30);
    }

    function testConsumerCannotTransfer() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");
        registerAndApproveUser(retailer1, "RETAILER");
        registerAndApproveUser(consumer1, "CONSUMER");
        registerAndApproveUser(consumer2, "CONSUMER");

        // Llevar tokens hasta consumer1
        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        vm.prank(factory1);
        supplyChain.createToken("Salsa de Tomate", 300, "{}", 1, 400);

        vm.prank(factory1);
        supplyChain.transfer(retailer1, 2, 200);
        vm.prank(retailer1);
        supplyChain.acceptTransfer(2);

        vm.prank(retailer1);
        supplyChain.createToken("Paquetes de Salsa", 50, "{}", 2, 150);

        vm.prank(retailer1);
        supplyChain.transfer(consumer1, 3, 30);
        vm.prank(consumer1);
        supplyChain.acceptTransfer(3);

        // Consumer NO puede transferir (falla porque no es el creador del token)
        vm.prank(consumer1);
        vm.expectRevert("Only token creator can transfer it");
        supplyChain.transfer(consumer2, 3, 10);
    }

    function testInvalidRoleTransfer_ProducerToRetailer() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(retailer1, "RETAILER");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        // Producer NO puede transferir directamente a Retailer
        vm.prank(producer1);
        vm.expectRevert("Invalid transfer: PRODUCER can only transfer to FACTORY");
        supplyChain.transfer(retailer1, 1, 500);
    }

    function testInvalidRoleTransfer_ProducerToConsumer() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(consumer1, "CONSUMER");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        // Producer NO puede transferir directamente a Consumer
        vm.prank(producer1);
        vm.expectRevert("Invalid transfer: PRODUCER can only transfer to FACTORY");
        supplyChain.transfer(consumer1, 1, 500);
    }

    function testInvalidRoleTransfer_FactoryToConsumer() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");
        registerAndApproveUser(consumer1, "CONSUMER");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        // Factory crea su propio token derivado
        vm.prank(factory1);
        supplyChain.createToken("Salsa de Tomate", 300, "{}", 1, 400);

        // Factory NO puede transferir directamente a Consumer (debe ir a RETAILER)
        vm.prank(factory1);
        vm.expectRevert("Invalid transfer: FACTORY can only transfer to RETAILER");
        supplyChain.transfer(consumer1, 2, 100);
    }

    function testInvalidRoleTransfer_RetailerToProducer() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");
        registerAndApproveUser(retailer1, "RETAILER");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        vm.prank(factory1);
        supplyChain.createToken("Salsa de Tomate", 300, "{}", 1, 400);

        vm.prank(factory1);
        supplyChain.transfer(retailer1, 2, 200);
        vm.prank(retailer1);
        supplyChain.acceptTransfer(2);

        // Retailer crea paquetes
        vm.prank(retailer1);
        supplyChain.createToken("Paquetes de Salsa", 50, "{}", 2, 150);

        // Retailer NO puede transferir de regreso a Producer
        vm.prank(retailer1);
        vm.expectRevert("Invalid transfer: RETAILER can only transfer to CONSUMER");
        supplyChain.transfer(producer1, 3, 20);
    }

    // ========== AUXILIARY FUNCTIONS TESTS ==========

    function testGetUserTransfers() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);

        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 200);

        // Producer debería tener 2 transferencias
        uint256[] memory producerTransfers = supplyChain.getUserTransfers(producer1);
        assertEq(producerTransfers.length, 2);
        assertEq(producerTransfers[0], 1);
        assertEq(producerTransfers[1], 2);

        // Factory también debería tener 2 transferencias (como receptor)
        uint256[] memory factoryTransfers = supplyChain.getUserTransfers(factory1);
        assertEq(factoryTransfers.length, 2);
    }

    function testEmptyUserTransfers() public {
        registerAndApproveUser(producer1, "PRODUCER");

        uint256[] memory transfers = supplyChain.getUserTransfers(producer1);
        assertEq(transfers.length, 0);
    }

    function testEmptyUserTokens() public {
        registerAndApproveUser(factory1, "FACTORY");

        uint256[] memory tokens = supplyChain.getUserTokens(factory1);
        assertEq(tokens.length, 0);
    }

    // ========== COMPLETE FLOW TESTS ==========

    function testCompleteSupplyChainFlow() public {
        // Registrar todos los actores
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");
        registerAndApproveUser(retailer1, "RETAILER");
        registerAndApproveUser(consumer1, "CONSUMER");

        // 1. Producer crea token de materia prima
        vm.prank(producer1);
        supplyChain.createToken("Tomate Fresco", 1000, '{"origin": "Ecuador", "organic": true}', 0, 0);

        assertEq(supplyChain.getTokenBalance(1, producer1), 1000);

        // 2. Producer → Factory (500 unidades)
        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);

        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        assertEq(supplyChain.getTokenBalance(1, producer1), 500);
        assertEq(supplyChain.getTokenBalance(1, factory1), 500);

        // 3. Factory crea producto procesado consumiendo 400 unidades del token padre
        vm.prank(factory1);
        supplyChain.createToken("Salsa de Tomate", 300, '{"processed": true, "batch": "A123"}', 1, 400);

        assertEq(supplyChain.getTokenBalance(1, factory1), 100); // 500 - 400 = 100
        assertEq(supplyChain.getTokenBalance(2, factory1), 300);

        // 4. Factory → Retailer (200 unidades de salsa)
        vm.prank(factory1);
        supplyChain.transfer(retailer1, 2, 200);

        vm.prank(retailer1);
        supplyChain.acceptTransfer(2);

        assertEq(supplyChain.getTokenBalance(2, factory1), 100);
        assertEq(supplyChain.getTokenBalance(2, retailer1), 200);

        // 5. Retailer crea paquetes y transfiere a Consumer
        vm.prank(retailer1);
        supplyChain.createToken("Paquetes de Salsa", 80, '{"package": "retail"}', 2, 150);

        assertEq(supplyChain.getTokenBalance(2, retailer1), 50); // 200 - 150 = 50
        assertEq(supplyChain.getTokenBalance(3, retailer1), 80);

        vm.prank(retailer1);
        supplyChain.transfer(consumer1, 3, 30);

        vm.prank(consumer1);
        supplyChain.acceptTransfer(3);

        assertEq(supplyChain.getTokenBalance(3, retailer1), 50);
        assertEq(supplyChain.getTokenBalance(3, consumer1), 30);

        // Verificar trazabilidad completa
        SupplyChain.Token memory packageToken = supplyChain.getToken(3);
        assertEq(packageToken.parentId, 2); // Paquetes derivan de Salsa

        SupplyChain.Token memory processedToken = supplyChain.getToken(2);
        assertEq(processedToken.parentId, 1); // Salsa deriva de Tomate

        SupplyChain.Token memory rawToken = supplyChain.getToken(1);
        assertEq(rawToken.parentId, 0); // Tomate es materia prima original
    }

    function testMultipleTokensFlow() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(producer2, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        // Producer1 crea 2 tokens diferentes
        vm.prank(producer1);
        supplyChain.createToken("Tomate", 1000, "{}", 0, 0);

        vm.prank(producer1);
        supplyChain.createToken("Cebolla", 800, "{}", 0, 0);

        // Producer2 crea otro token
        vm.prank(producer2);
        supplyChain.createToken("Pimiento", 600, "{}", 0, 0);

        // Verificar que cada producer tiene sus tokens
        uint256[] memory producer1Tokens = supplyChain.getUserTokens(producer1);
        assertEq(producer1Tokens.length, 2);

        uint256[] memory producer2Tokens = supplyChain.getUserTokens(producer2);
        assertEq(producer2Tokens.length, 1);

        // Factory recibe de ambos producers
        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        vm.prank(producer2);
        supplyChain.transfer(factory1, 3, 300);
        vm.prank(factory1);
        supplyChain.acceptTransfer(2);

        // Factory ahora tiene 2 tokens diferentes
        uint256[] memory factoryTokens = supplyChain.getUserTokens(factory1);
        assertEq(factoryTokens.length, 2);
    }

    function testTraceabilityFlow() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");
        registerAndApproveUser(retailer1, "RETAILER");

        // Producer crea materia prima
        vm.prank(producer1);
        supplyChain.createToken("Leche Cruda", 1000, '{"origin": "Farm A"}', 0, 0);

        // Producer transfiere leche a Factory1
        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 800);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        // Factory1 crea producto derivado nivel 1 consumiendo leche
        vm.prank(factory1);
        supplyChain.createToken("Queso", 500, '{"type": "Cheddar"}', 1, 600);

        // Factory1 transfiere queso a Retailer1
        vm.prank(factory1);
        supplyChain.transfer(retailer1, 2, 300);
        vm.prank(retailer1);
        supplyChain.acceptTransfer(2);

        // Retailer1 crea paquetes derivados nivel 2 (del queso)
        vm.prank(retailer1);
        supplyChain.createToken("Paquetes de Queso", 200, '{"type": "Retail Pack"}', 2, 250);

        // Verificar cadena de parentId
        SupplyChain.Token memory paquetes = supplyChain.getToken(3);
        assertEq(paquetes.parentId, 2); // Paquetes derivan de Queso

        SupplyChain.Token memory queso = supplyChain.getToken(2);
        assertEq(queso.parentId, 1); // Queso deriva de Leche

        SupplyChain.Token memory leche = supplyChain.getToken(1);
        assertEq(leche.parentId, 0); // Leche es materia prima original
    }

    // ========== ROLE RESTRICTIONS WITH AMOUNTCONSUMED TESTS ==========

    function testProducerCannotCreateDerivedToken() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(producer2, "PRODUCER");

        // Producer1 crea token original
        vm.prank(producer1);
        supplyChain.createToken("Cafe en grano", 1000, "{}", 0, 0);

        // Producer2 NO puede crear token derivado
        vm.prank(producer2);
        vm.expectRevert("Producers can only create original tokens");
        supplyChain.createToken("Cafe tostado", 500, "{}", 1, 100);
    }

    function testProducerCannotUseAmountConsumed() public {
        registerAndApproveUser(producer1, "PRODUCER");

        // Producer NO puede usar amountConsumed > 0 cuando crea token original
        vm.prank(producer1);
        vm.expectRevert("Producers cannot consume tokens when creating");
        supplyChain.createToken("Cafe", 1000, "{}", 0, 100);
    }

    function testFactoryCannotCreateOriginalToken() public {
        registerAndApproveUser(factory1, "FACTORY");

        // Factory NO puede crear token original (parentId = 0)
        vm.prank(factory1);
        vm.expectRevert("Factories and retailers must create derived tokens from existing materials");
        supplyChain.createToken("Cafe", 1000, "{}", 0, 0);
    }

    function testRetailerCannotCreateOriginalToken() public {
        registerAndApproveUser(retailer1, "RETAILER");

        // Retailer NO puede crear token original (parentId = 0)
        vm.prank(retailer1);
        vm.expectRevert("Factories and retailers must create derived tokens from existing materials");
        supplyChain.createToken("Producto", 100, "{}", 0, 0);
    }

    function testFactoryMustUseAmountConsumed() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        // Producer crea token
        vm.prank(producer1);
        supplyChain.createToken("Cafe en grano", 1000, "{}", 0, 0);

        // Transferir a Factory
        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        // Factory NO puede crear derivado con amountConsumed = 0
        vm.prank(factory1);
        vm.expectRevert("Must specify how many parent tokens to consume");
        supplyChain.createToken("Cafe tostado", 400, "{}", 1, 0);
    }

    function testRetailerMustUseAmountConsumed() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");
        registerAndApproveUser(retailer1, "RETAILER");

        // Producer → Factory
        vm.prank(producer1);
        supplyChain.createToken("Cafe", 1000, "{}", 0, 0);
        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        // Factory crea producto derivado y transfiere a Retailer
        vm.prank(factory1);
        supplyChain.createToken("Cafe procesado", 300, "{}", 1, 400);

        vm.prank(factory1);
        supplyChain.transfer(retailer1, 2, 200);
        vm.prank(retailer1);
        supplyChain.acceptTransfer(2);

        // Retailer NO puede crear derivado con amountConsumed = 0
        vm.prank(retailer1);
        vm.expectRevert("Must specify how many parent tokens to consume");
        supplyChain.createToken("Paquete", 100, "{}", 2, 0);
    }

    // ========== TOKEN CONSUMPTION TESTS ==========

    function testFactoryConsumesParentTokens() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        // Producer crea 1200kg de cafe
        vm.prank(producer1);
        supplyChain.createToken("Cafe en grano", 1200, "{}", 0, 0);

        // Transferir a Factory
        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 1200);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        assertEq(supplyChain.getTokenBalance(1, factory1), 1200);

        // Factory crea 800kg de cafe tostado consumiendo 1000kg de cafe en grano
        vm.prank(factory1);
        supplyChain.createToken("Cafe tostado", 800, "{}", 1, 1000);

        // Verificar balance del padre se redujo
        assertEq(supplyChain.getTokenBalance(1, factory1), 200); // 1200 - 1000 = 200
        assertEq(supplyChain.getTokenBalance(2, factory1), 800);
    }

    function testRetailerConsumesParentTokens() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");
        registerAndApproveUser(retailer1, "RETAILER");

        // Crear y transferir tokens
        vm.prank(producer1);
        supplyChain.createToken("Cafe", 1000, "{}", 0, 0);
        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 1000);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        vm.prank(factory1);
        supplyChain.createToken("Cafe procesado", 800, "{}", 1, 900);
        vm.prank(factory1);
        supplyChain.transfer(retailer1, 2, 500);
        vm.prank(retailer1);
        supplyChain.acceptTransfer(2);

        assertEq(supplyChain.getTokenBalance(2, retailer1), 500);

        // Retailer crea paquetes consumiendo 400 unidades
        vm.prank(retailer1);
        supplyChain.createToken("Paquetes de cafe", 40, "{}", 2, 400);

        // Verificar consumo
        assertEq(supplyChain.getTokenBalance(2, retailer1), 100); // 500 - 400 = 100
        assertEq(supplyChain.getTokenBalance(3, retailer1), 40);
    }

    function testCannotConsumeMoreThanBalance() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Cafe", 1000, "{}", 0, 0);
        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 500);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        assertEq(supplyChain.getTokenBalance(1, factory1), 500);

        // Factory intenta consumir 600 pero solo tiene 500
        vm.prank(factory1);
        vm.expectRevert("Insufficient parent token balance");
        supplyChain.createToken("Cafe tostado", 400, "{}", 1, 600);
    }

    function testCannotCreateDerivedWithoutParentTokens() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        // Producer crea token pero NO transfiere a factory
        vm.prank(producer1);
        supplyChain.createToken("Cafe", 1000, "{}", 0, 0);

        // Factory intenta crear derivado sin tener el token padre
        vm.prank(factory1);
        vm.expectRevert("Insufficient parent token balance");
        supplyChain.createToken("Cafe tostado", 400, "{}", 1, 100);
    }

    function testMultipleConsumptionsSameToken() public {
        registerAndApproveUser(producer1, "PRODUCER");
        registerAndApproveUser(factory1, "FACTORY");

        vm.prank(producer1);
        supplyChain.createToken("Cafe", 1000, "{}", 0, 0);
        vm.prank(producer1);
        supplyChain.transfer(factory1, 1, 1000);
        vm.prank(factory1);
        supplyChain.acceptTransfer(1);

        assertEq(supplyChain.getTokenBalance(1, factory1), 1000);

        // Primer producto: consume 400
        vm.prank(factory1);
        supplyChain.createToken("Cafe tostado oscuro", 300, "{}", 1, 400);
        assertEq(supplyChain.getTokenBalance(1, factory1), 600);

        // Segundo producto: consume 300
        vm.prank(factory1);
        supplyChain.createToken("Cafe tostado claro", 250, "{}", 1, 300);
        assertEq(supplyChain.getTokenBalance(1, factory1), 300);

        // Tercer producto: consume 200
        vm.prank(factory1);
        supplyChain.createToken("Cafe molido", 150, "{}", 1, 200);
        assertEq(supplyChain.getTokenBalance(1, factory1), 100);

        // Verificar que tiene los 3 productos creados
        assertEq(supplyChain.getTokenBalance(2, factory1), 300);
        assertEq(supplyChain.getTokenBalance(3, factory1), 250);
        assertEq(supplyChain.getTokenBalance(4, factory1), 150);
    }

    function testCannotUseAmountConsumedWithoutParentId() public {
        registerAndApproveUser(producer1, "PRODUCER");

        // Producer intenta usar amountConsumed sin parentId
        vm.prank(producer1);
        vm.expectRevert("Producers cannot consume tokens when creating");
        supplyChain.createToken("Cafe", 1000, "{}", 0, 500);
    }
}
