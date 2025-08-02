const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { getAccount, getAssociatedTokenAddress } = require('@solana/spl-token');
const bs58 = require('bs58');
const Logger = require('../utils/Logger');

class WalletManager {
  constructor() {
    this.logger = new Logger('WalletManager');
    this.connection = null;
    this.wallet = null;
    this.balance = {
      sol: 0,
      tokens: {}
    };
  }

  async initialize() {
    this.logger.info('👛 Initializing Wallet Manager...');
    
    try {
      // Connect to Solana network
      const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      this.connection = new Connection(rpcUrl, 'confirmed');
      
      // Initialize wallet based on trading mode
      const tradingMode = process.env.TRADING_MODE || 'paper';
      
      if (tradingMode === 'paper') {
        // For paper trading, generate a demo wallet
        this.wallet = Keypair.generate();
        this.logger.info('📝 Paper trading mode: Using demo wallet');
        this.logger.info(`Demo wallet public key: ${this.wallet.publicKey.toString()}`);
      } else if (process.env.SOLANA_PRIVATE_KEY && 
                 process.env.SOLANA_PRIVATE_KEY !== 'your_solana_wallet_private_key_here') {
        try {
          const privateKeyBytes = bs58.decode(process.env.SOLANA_PRIVATE_KEY);
          this.wallet = Keypair.fromSecretKey(privateKeyBytes);
          this.logger.info('🔑 Live trading mode: Using provided wallet');
        } catch (error) {
          this.logger.error('Invalid private key format, using demo wallet');
          this.wallet = Keypair.generate();
        }
      } else {
        // Generate a new wallet for demo purposes
        this.wallet = Keypair.generate();
        this.logger.warn('⚠️ No valid private key provided, generated new wallet for demo');
        this.logger.info(`Demo wallet public key: ${this.wallet.publicKey.toString()}`);
      }
      
      // Get initial balance
      await this.updateBalance();
      
      this.logger.info(`✅ Wallet Manager initialized - Address: ${this.wallet.publicKey.toString()}`);
      this.logger.info(`💰 SOL Balance: ${this.balance.sol} SOL`);
      
    } catch (error) {
      this.logger.error('Failed to initialize wallet manager:', error);
      throw error;
    }
  }

  async updateBalance() {
    try {
      const tradingMode = process.env.TRADING_MODE || 'paper';
      
      if (tradingMode === 'paper') {
        // Simulate 5 SOL balance for paper trading
        this.balance.sol = 5.0;
        
        // Initialize demo token holdings for paper trading
        if (!this.balance.tokens || Object.keys(this.balance.tokens).length === 0) {
          this.initializeDemoTokens();
        }
        
        this.logger.info('📝 Paper trading: Simulated SOL balance set to 5.0 SOL');
      } else {
        // Get real SOL balance for live trading
        const solBalance = await this.connection.getBalance(this.wallet.publicKey);
        this.balance.sol = solBalance / 1e9; // Convert lamports to SOL
        
        // Get token balances (this would be expanded for specific tokens)
        await this.updateTokenBalances();
      }
      
    } catch (error) {
      this.logger.error('Failed to update balance:', error);
    }
  }

  initializeDemoTokens() {
    // Initialize some demo token holdings for paper trading
    this.balance.tokens = {
      'BONK': {
        balance: 1250000,
        decimals: 5,
        price: 0.000025,
        purchasePrice: 0.000020,
        address: 'demo_bonk_account'
      },
      'WIF': {
        balance: 45,
        decimals: 6,
        price: 2.35,
        purchasePrice: 1.80,
        address: 'demo_wif_account'
      },
      'PEPE': {
        balance: 850000,
        decimals: 6,
        price: 0.000012,
        purchasePrice: 0.000008,
        address: 'demo_pepe_account'
      }
    };
    
    this.logger.info('📊 Initialized demo token portfolio for paper trading');
  }

  async updateTokenBalances() {
    try {
      // Get all token accounts for this wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        this.wallet.publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );
      
      const tokens = {};
      
      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info;
        const mint = accountData.mint;
        const balance = parseFloat(accountData.tokenAmount.uiAmount || 0);
        
        if (balance > 0) {
          tokens[mint] = {
            balance: balance,
            decimals: accountData.tokenAmount.decimals,
            address: tokenAccount.pubkey.toString()
          };
        }
      }
      
      this.balance.tokens = tokens;
      
    } catch (error) {
      this.logger.error('Failed to update token balances:', error);
    }
  }

  async getTokenPrice(tokenMint) {
    try {
      // This would integrate with Jupiter or other DEX APIs to get token prices
      // For now, return a placeholder
      return 0.001; // Placeholder price in SOL
    } catch (error) {
      this.logger.error(`Failed to get price for token ${tokenMint}:`, error);
      return 0;
    }
  }

  async swapTokens(fromToken, toToken, amount) {
    try {
      this.logger.info(`🔄 Swapping ${amount} ${fromToken} to ${toToken}`);
      
      if (process.env.TRADING_MODE === 'paper') {
        // Simulate swap for paper trading
        this.logger.info('📝 Paper trade swap simulated');
        return {
          success: true,
          txId: 'paper_trade_' + Date.now(),
          amountOut: amount * 0.998 // Simulate 0.2% slippage
        };
      }
      
      // For live trading, this would integrate with Jupiter API
      const swapResult = await this.executeJupiterSwap(fromToken, toToken, amount);
      
      // Update balances after swap
      await this.updateBalance();
      
      return swapResult;
      
    } catch (error) {
      this.logger.error('Failed to swap tokens:', error);
      throw error;
    }
  }

  async executeJupiterSwap(fromToken, toToken, amount) {
    try {
      // Get quote from Jupiter API
      const quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${fromToken}&outputMint=${toToken}&amount=${amount}&slippageBps=50`);
      const quoteData = await quoteResponse.json();
      
      if (!quoteData.data || quoteData.data.length === 0) {
        throw new Error('No routes found for swap');
      }
      
      const bestRoute = quoteData.data[0];
      
      // Get swap transaction
      const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: bestRoute,
          userPublicKey: this.wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
        }),
      });
      
      const swapData = await swapResponse.json();
      
      if (swapData.error) {
        throw new Error(swapData.error);
      }
      
      // Execute the swap transaction
      const transaction = Transaction.from(Buffer.from(swapData.swapTransaction, 'base64'));
      transaction.sign(this.wallet);
      
      const txId = await this.connection.sendRawTransaction(transaction.serialize());
      await this.connection.confirmTransaction(txId);
      
      this.logger.info(`✅ Swap executed successfully - TX: ${txId}`);
      
      return {
        success: true,
        txId: txId,
        amountOut: bestRoute.outAmount
      };
      
    } catch (error) {
      this.logger.error('Failed to execute Jupiter swap:', error);
      throw error;
    }
  }

  async buyToken(tokenMint, amountSOL) {
    try {
      this.logger.info(`🛒 Buying token ${tokenMint} with ${amountSOL} SOL`);
      
      // Check if we have enough SOL
      if (this.balance.sol < amountSOL) {
        throw new Error(`Insufficient SOL balance. Have: ${this.balance.sol}, Need: ${amountSOL}`);
      }

      if (process.env.TRADING_MODE === 'paper') {
        // Simulate token purchase for paper trading
        const tokenPrice = this.getSimulatedTokenPrice(tokenMint);
        const tokensReceived = (amountSOL * 0.998) / tokenPrice; // 0.2% slippage
        
        // Update SOL balance
        this.balance.sol -= amountSOL;
        
        // Update or create token holding
        if (!this.balance.tokens[tokenMint]) {
          this.balance.tokens[tokenMint] = {
            balance: 0,
            decimals: 6,
            price: tokenPrice,
            purchasePrice: tokenPrice,
            address: `demo_${tokenMint.toLowerCase()}_account`
          };
        }
        
        // Add to existing balance
        const existingBalance = this.balance.tokens[tokenMint].balance || 0;
        this.balance.tokens[tokenMint].balance = existingBalance + tokensReceived;
        this.balance.tokens[tokenMint].purchasePrice = tokenPrice; // Update to most recent purchase price
        
        this.logger.info(`✅ Paper trade: Bought ${tokensReceived.toFixed(2)} ${tokenMint} for ${amountSOL} SOL`);
        
        return {
          success: true,
          txId: 'paper_trade_' + Date.now(),
          amountOut: tokensReceived,
          tokenPrice: tokenPrice
        };
      }
      
      // Swap SOL for token
      const solMint = 'So11111111111111111111111111111111111111112'; // Wrapped SOL mint
      const result = await this.swapTokens(solMint, tokenMint, amountSOL * 1e9); // Convert to lamports
      
      return result;
      
    } catch (error) {
      this.logger.error('Failed to buy token:', error);
      throw error;
    }
  }

  getSimulatedTokenPrice(tokenSymbol) {
    // Simulate realistic token prices for demo
    const tokenPrices = {
      'BONK': 0.000025,
      'WIF': 2.35,
      'PEPE': 0.000012,
      'POPCAT': 0.85,
      'MEW': 0.0075,
      'BOME': 0.012,
      'SLERF': 0.18,
      'MYRO': 0.095,
      'BOOK': 0.032,
      'ZEUS': 0.0045,
      'HARAMBE': 0.0028,
      'FLOKI': 0.00015,
      'SHIB': 0.0000087,
      'DOGE': 0.085,
      'TRUMP': 0.0035
    };
    
    return tokenPrices[tokenSymbol] || 0.001; // Default fallback
  }

  async sellToken(tokenMint, amount) {
    try {
      this.logger.info(`💰 Selling ${amount} of token ${tokenMint}`);
      
      // Check if we have enough tokens
      const tokenBalance = this.balance.tokens[tokenMint]?.balance || 0;
      if (tokenBalance < amount) {
        throw new Error(`Insufficient token balance. Have: ${tokenBalance}, Need: ${amount}`);
      }
      
      // Swap token for SOL
      const solMint = 'So11111111111111111111111111111111111111112'; // Wrapped SOL mint
      const result = await this.swapTokens(tokenMint, solMint, amount);
      
      return result;
      
    } catch (error) {
      this.logger.error('Failed to sell token:', error);
      throw error;
    }
  }

  getBalance() {
    return this.balance;
  }

  getWalletAddress() {
    return this.wallet?.publicKey.toString();
  }

  async getTransactionHistory(limit = 100) {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        this.wallet.publicKey,
        { limit }
      );
      
      const transactions = [];
      
      for (const sig of signatures.slice(0, 10)) { // Limit to prevent too many API calls
        try {
          const tx = await this.connection.getParsedTransaction(sig.signature);
          if (tx) {
            transactions.push({
              signature: sig.signature,
              blockTime: sig.blockTime,
              status: sig.err ? 'failed' : 'success',
              fee: tx.meta?.fee || 0,
              instructions: tx.transaction.message.instructions.length
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to get transaction ${sig.signature}:`, error.message);
        }
      }
      
      return transactions;
      
    } catch (error) {
      this.logger.error('Failed to get transaction history:', error);
      return [];
    }
  }

  async estimateGas(transaction) {
    try {
      // Estimate transaction fee
      const feeForMessage = await this.connection.getFeeForMessage(transaction.compileMessage());
      return feeForMessage?.value || 5000; // Default 5000 lamports
    } catch (error) {
      this.logger.error('Failed to estimate gas:', error);
      return 5000; // Default fallback
    }
  }

  // Risk management helpers
  getPortfolioValue() {
    let totalValue = this.balance.sol;
    
    // Add token values (would need real-time pricing)
    for (const [mint, tokenData] of Object.entries(this.balance.tokens)) {
      // This would multiply by actual token price
      totalValue += tokenData.balance * 0.001; // Placeholder calculation
    }
    
    return totalValue;
  }

  isHealthyBalance() {
    // Keep at least 0.1 SOL for transaction fees
    return this.balance.sol > 0.1;
  }
}

module.exports = WalletManager;
