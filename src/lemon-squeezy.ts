// Lemon Squeezy Integration for Figma Plugin
// Handles subscription management and license validation

import { LemonSqueezyConfig, LicenseValidationResponse, SubscriptionStatus } from './types';

export class LemonSqueezyService {
    private config: LemonSqueezyConfig;
    private baseUrl = 'https://api.lemonsqueezy.com/v1';

    constructor(config: LemonSqueezyConfig) {
        this.config = config;
    }

    // Test API connection
    async testConnection(): Promise<{ success: boolean; message: string }> {
        // In test mode, simulate a successful connection
        if (this.config.storeId === 'test-store') {
            return {
                success: true,
                message: 'Test mode: API connection simulated successfully'
            };
        }

        try {
            const response = await fetch(`${this.baseUrl}/stores/${this.config.storeId}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/vnd.api+json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    message: `Connected to store: ${data.data.attributes.name}`
                };
            } else {
                return {
                    success: false,
                    message: `API Error: ${response.status} ${response.statusText}`
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    // Validate license key
    async validateLicense(licenseKey: string): Promise<LicenseValidationResponse | null> {
        // In test mode, simulate license validation
        if (this.config.storeId === 'test-store') {
            if (licenseKey === 'test-license-key') {
                return {
                    valid: true,
                    license_key: {
                        id: 'test-license-id',
                        status: 'active',
                        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
                        customer: {
                            id: 'test-customer-id',
                            email: 'test@example.com'
                        }
                    }
                };
            } else {
                return {
                    valid: false,
                    license_key: {
                        id: '',
                        status: 'invalid',
                        expires_at: null,
                        customer: {
                            id: '',
                            email: ''
                        }
                    }
                };
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/licenses/validate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/vnd.api+json'
                },
                body: JSON.stringify({
                    license_key: licenseKey,
                    instance_name: 'Figma Plugin'
                })
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('License validation failed:', error);
            return null;
        }
    }

    // Get subscription status
    async getSubscriptionStatus(customerId: string): Promise<SubscriptionStatus> {
        try {
            const response = await fetch(`${this.baseUrl}/subscriptions?filter[customer_id]=${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Accept': 'application/vnd.api+json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const subscription = data.data[0];

                if (subscription) {
                    return {
                        isActive: subscription.attributes.status === 'active',
                        isPremium: true,
                        expiresAt: subscription.attributes.ends_at,
                        customerId: subscription.attributes.customer_id,
                        subscriptionId: subscription.id
                    };
                }
            }

            return {
                isActive: false,
                isPremium: false
            };
        } catch (error) {
            console.error('Failed to get subscription status:', error);
            return {
                isActive: false,
                isPremium: false
            };
        }
    }

    // Generate checkout URL
    generateCheckoutUrl(email?: string): string {
        const params = new URLSearchParams({
            store: this.config.storeId,
            product: this.config.productId,
            variant: this.config.variantId
        });

        if (email) {
            params.append('checkout[email]', email);
        }

        return `https://checkout.lemonsqueezy.com/checkout/buy/${this.config.variantId}?${params.toString()}`;
    }

    // Get product information
    async getProductInfo(): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/products/${this.config.productId}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Accept': 'application/vnd.api+json'
                }
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Failed to get product info:', error);
            return null;
        }
    }
}

import { LEMON_SQUEEZY_CONFIG, TEST_CONFIG } from './lemon-squeezy-config';

// Default configuration - uses test config in development
export const defaultLemonSqueezyConfig: LemonSqueezyConfig =
    LEMON_SQUEEZY_CONFIG.testMode ? TEST_CONFIG : LEMON_SQUEEZY_CONFIG;