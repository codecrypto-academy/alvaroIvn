// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SupplyChain.sol";

/**
 * @title Deploy
 * @notice Script de despliegue para el contrato SupplyChain
 * @dev Usar con: forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
 */
contract Deploy is Script {
    function run() external returns (SupplyChain) {
        // Obtener la private key del deployer
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Comenzar broadcasting de transacciones
        vm.startBroadcast(deployerPrivateKey);

        // Desplegar el contrato SupplyChain
        SupplyChain supplyChain = new SupplyChain();

        // Detener broadcasting
        vm.stopBroadcast();

        // Imprimir información del despliegue
        console.log("===========================================");
        console.log("SupplyChain Contract Deployed Successfully!");
        console.log("===========================================");
        console.log("Contract Address:", address(supplyChain));
        console.log("Admin Address:", supplyChain.admin());
        console.log("Network: Anvil (Local)");
        console.log("===========================================");

        return supplyChain;
    }
}
