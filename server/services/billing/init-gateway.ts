import { billingStorage } from "../../storage-billing";
import { DEFAULT_PAYMENT_GATEWAY, getCurrentGatewayConfig } from "../../config/payment.config";

// Initialize default payment gateway provider
export async function initializeDefaultGateway() {
  try {
    const gatewayConfig = getCurrentGatewayConfig();
    
    // IMPORTANT: Set the PaymentGatewayFactory default provider to match our config
    const { PaymentGatewayFactory } = await import('../payments/PaymentGatewayFactory');
    PaymentGatewayFactory.setDefaultProvider(DEFAULT_PAYMENT_GATEWAY);
    console.log(`🔧 PaymentGatewayFactory default provider set to: ${DEFAULT_PAYMENT_GATEWAY}`);
    
    // Check if the default provider already exists
    const existingProvider = await billingStorage.getGatewayProviderByName(DEFAULT_PAYMENT_GATEWAY);
    
    if (existingProvider) {
      console.log(`✅ Payment gateway provider already initialized: ${existingProvider.providerName}`);
      
      if (!existingProvider.isDefault) {
        console.log(`⚠️  Note: ${existingProvider.providerName} exists but is not set as default. You may need to update it in the database.`);
      }
      
      return existingProvider;
    }

    // Create the default provider based on config
    const provider = await billingStorage.createGatewayProvider({
      providerName: DEFAULT_PAYMENT_GATEWAY,
      isActive: true,
      isDefault: true,
      configuration: {
        supportedCurrencies: gatewayConfig.supportedCurrencies,
        features: gatewayConfig.features,
      },
    });

    console.log(`✅ Payment gateway provider initialized: ${provider.providerName} (${gatewayConfig.name})`);
    return provider;
  } catch (error) {
    console.error('Failed to initialize payment gateway provider:', error);
    // Don't throw - this is not critical for app startup
    return null;
  }
}
