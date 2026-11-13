// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockPaymentToken
 * @author Propx Protocol
 * @notice Mock ERC-20 token used as payment currency in the Propx marketplace.
 *         Represents a simulated INR-equivalent stablecoin for prototype/demo purposes.
 *
 * @dev PROTOTYPE NOTICE:
 *      This is NOT a real stablecoin or regulated payment instrument.
 *      In production, an actual regulated stablecoin, CBDC, or payment rail would replace this.
 *      1 mINR token = 1 unit of simulated Indian Rupee (18 decimals).
 */
contract MockPaymentToken is ERC20, Ownable {
    /// @notice Maximum tokens mintable via public faucet per call
    uint256 public constant MAX_FAUCET_AMOUNT = 10_000_000 * 10 ** 18;

    event FaucetMinted(address indexed recipient, uint256 amount);

    constructor() ERC20("Mock INR Stablecoin", "mINR") Ownable(msg.sender) {
        // Mint 100 million mINR to deployer for initial distribution
        _mint(msg.sender, 100_000_000 * 10 ** 18);
    }

    /**
     * @notice Public faucet: anyone can mint tokens for testing.
     * @param amount Amount to mint in wei (18 decimals)
     */
    function faucet(uint256 amount) external {
        require(amount > 0, "MockPaymentToken: amount must be > 0");
        require(amount <= MAX_FAUCET_AMOUNT, "MockPaymentToken: exceeds faucet limit");
        _mint(msg.sender, amount);
        emit FaucetMinted(msg.sender, amount);
    }

    /**
     * @notice Owner can mint arbitrary amounts (for test setup scripts).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "MockPaymentToken: mint to zero address");
        _mint(to, amount);
    }
}

