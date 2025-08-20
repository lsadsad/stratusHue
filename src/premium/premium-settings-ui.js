"use strict";
// Premium Settings UI Component
// Provides a settings interface for managing premium features
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREMIUM_SETTINGS_CSS = exports.PremiumSettingsUI = void 0;
const premium_features_1 = require("./premium-features");
const premium_features_config_1 = require("./premium-features-config");
class PremiumSettingsUI {
    constructor(containerId) {
        this.container = null;
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Premium settings container '${containerId}' not found`);
        }
    }
    async render() {
        if (!this.container)
            return;
        const featureStatus = premium_features_1.premiumFeatures.getFeatureStatus();
        this.container.innerHTML = `
      <div class="premium-settings">
        <div class="settings-header">
          <h2>Premium Features</h2>
          <div class="subscription-status ${featureStatus.isPremium ? 'premium' : 'free'}">
            ${featureStatus.isPremium ? '✨ Premium Active' : '🆓 Free Plan'}
          </div>
        </div>
        
        <div class="settings-content">
          ${await this.renderFeatureCategories(featureStatus)}
          ${this.renderUsageStats()}
          ${this.renderUpgradeSection(featureStatus)}
        </div>
      </div>
    `;
        this.attachEventListeners();
    }
    async renderFeatureCategories(featureStatus) {
        const categories = Object.entries(premium_features_config_1.FEATURE_CATEGORIES);
        const categoryHtml = await Promise.all(categories.map(async ([categoryKey, category]) => {
            const features = (0, premium_features_config_1.getFeaturesByCategory)(categoryKey);
            if (features.length === 0)
                return '';
            const featureItems = features.map(({ feature, name, description, icon }) => {
                const isAvailable = featureStatus.features[feature];
                const isInFreeTier = feature === premium_features_config_1.PREMIUM_FEATURES.UNLIMITED_BOOKMARKS ||
                    feature === premium_features_config_1.PREMIUM_FEATURES.CUSTOM_EMOJI_SETS;
                return `
            <div class="feature-item ${isAvailable ? 'available' : 'locked'}">
              <div class="feature-icon">${icon}</div>
              <div class="feature-info">
                <div class="feature-name">${name}</div>
                <div class="feature-description">${description}</div>
                ${isInFreeTier && !featureStatus.isPremium ? this.renderLimitInfo(feature, featureStatus) : ''}
              </div>
              <div class="feature-status">
                ${isAvailable ? '✅' : '🔒'}
              </div>
            </div>
          `;
            }).join('');
            return `
          <div class="feature-category">
            <div class="category-header">
              <span class="category-icon">${category.icon}</span>
              <div class="category-info">
                <h3>${category.name}</h3>
                <p>${category.description}</p>
              </div>
            </div>
            <div class="feature-list">
              ${featureItems}
            </div>
          </div>
        `;
        }));
        return categoryHtml.join('');
    }
    renderLimitInfo(feature, featureStatus) {
        const limits = featureStatus.limits;
        if (feature === premium_features_config_1.PREMIUM_FEATURES.UNLIMITED_BOOKMARKS) {
            const current = 0; // You'd get this from your bookmark count
            const max = limits.MAX_BOOKMARKS;
            return `
        <div class="limit-info">
          <div class="limit-bar">
            <div class="limit-progress" style="width: ${(current / max) * 100}%"></div>
          </div>
          <div class="limit-text">${current}/${max} bookmarks used</div>
        </div>
      `;
        }
        if (feature === premium_features_config_1.PREMIUM_FEATURES.CUSTOM_EMOJI_SETS) {
            const max = limits.MAX_EMOJI_SETS;
            return `
        <div class="limit-info">
          <div class="limit-text">${max} emoji sets available</div>
        </div>
      `;
        }
        return '';
    }
    renderUsageStats() {
        return `
      <div class="usage-stats">
        <h3>Usage Statistics</h3>
        <div id="usage-stats-content">
          <p>Loading usage data...</p>
        </div>
      </div>
    `;
    }
    renderUpgradeSection(featureStatus) {
        if (featureStatus.isPremium) {
            return `
        <div class="premium-section">
          <h3>Premium Account</h3>
          <p>You have access to all premium features!</p>
          <div class="premium-actions">
            <button id="manage-subscription" class="secondary-btn">Manage Subscription</button>
            <button id="deactivate-license" class="danger-btn">Deactivate License</button>
          </div>
        </div>
      `;
        }
        return `
      <div class="upgrade-section">
        <h3>Upgrade to Premium</h3>
        <p>Unlock all features and remove limits</p>
        <div class="upgrade-benefits">
          <div class="benefit">✨ Unlimited bookmarks</div>
          <div class="benefit">🎨 All emoji sets</div>
          <div class="benefit">📤 Export bookmarks</div>
          <div class="benefit">👥 Team sharing</div>
          <div class="benefit">🚀 Priority support</div>
        </div>
        <div class="upgrade-actions">
          <button id="upgrade-now" class="premium-btn">Upgrade Now</button>
          <button id="enter-license" class="secondary-btn">I Have a License</button>
        </div>
      </div>
    `;
    }
    attachEventListeners() {
        var _a, _b, _c, _d;
        // Upgrade buttons
        (_a = document.getElementById('upgrade-now')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            this.handleUpgrade();
        });
        (_b = document.getElementById('enter-license')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
            this.showLicenseModal();
        });
        (_c = document.getElementById('manage-subscription')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => {
            this.handleManageSubscription();
        });
        (_d = document.getElementById('deactivate-license')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => {
            this.handleDeactivateLicense();
        });
        // Load usage stats
        this.loadUsageStats();
    }
    async loadUsageStats() {
        const statsContainer = document.getElementById('usage-stats-content');
        if (!statsContainer)
            return;
        try {
            const features = [
                premium_features_config_1.PREMIUM_FEATURES.UNLIMITED_BOOKMARKS,
                premium_features_config_1.PREMIUM_FEATURES.EXPORT_BOOKMARKS,
                premium_features_config_1.PREMIUM_FEATURES.CUSTOM_EMOJI_SETS,
            ];
            const usageData = await Promise.all(features.map(async (feature) => {
                const usage = await premium_features_1.premiumFeatures.getFeatureUsage(feature);
                const description = premium_features_1.premiumFeatures.getFeatureDescription(feature);
                return { feature, usage, description };
            }));
            const statsHtml = usageData.map(({ feature, usage, description }) => `
        <div class="usage-item">
          <div class="usage-icon">${(description === null || description === void 0 ? void 0 : description.icon) || '📊'}</div>
          <div class="usage-info">
            <div class="usage-name">${(description === null || description === void 0 ? void 0 : description.name) || feature}</div>
            <div class="usage-numbers">
              <span>Total: ${usage.count}</span>
              <span>Today: ${usage.dailyCount}</span>
            </div>
          </div>
        </div>
      `).join('');
            statsContainer.innerHTML = statsHtml || '<p>No usage data available</p>';
        }
        catch (error) {
            statsContainer.innerHTML = '<p>Failed to load usage statistics</p>';
        }
    }
    handleUpgrade() {
        // Send message to main plugin to handle upgrade
        parent.postMessage({
            pluginMessage: {
                type: 'open-upgrade-url'
            }
        }, '*');
    }
    showLicenseModal() {
        // Show license input modal
        parent.postMessage({
            pluginMessage: {
                type: 'show-license-modal'
            }
        }, '*');
    }
    handleManageSubscription() {
        // Open subscription management
        const manageUrl = 'https://app.lemonsqueezy.com/my-orders';
        parent.postMessage({
            pluginMessage: {
                type: 'show-upgrade-url',
                url: manageUrl
            }
        }, '*');
    }
    async handleDeactivateLicense() {
        if (confirm('Are you sure you want to deactivate your premium license?')) {
            await premium_features_1.premiumFeatures.deactivateLicense();
            await this.render(); // Re-render to show updated state
        }
    }
    // Public method to refresh the UI
    async refresh() {
        await this.render();
    }
}
exports.PremiumSettingsUI = PremiumSettingsUI;
// CSS styles for the premium settings UI
exports.PREMIUM_SETTINGS_CSS = `
  .premium-settings {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #f5f5f5;
    background: #0f0f0f;
    padding: 16px;
    border-radius: 8px;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #2a2a2a;
  }

  .settings-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .subscription-status {
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
  }

  .subscription-status.premium {
    background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
    color: white;
  }

  .subscription-status.free {
    background: #2a2a2a;
    color: #f5f5f5;
  }

  .feature-category {
    margin-bottom: 24px;
  }

  .category-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }

  .category-icon {
    font-size: 20px;
    margin-right: 12px;
  }

  .category-info h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .category-info p {
    margin: 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    padding: 12px;
    background: #1a1a1a;
    border-radius: 8px;
    border: 1px solid #2a2a2a;
  }

  .feature-item.available {
    border-color: rgba(76, 222, 128, 0.3);
    background: rgba(76, 222, 128, 0.05);
  }

  .feature-item.locked {
    opacity: 0.6;
  }

  .feature-icon {
    font-size: 18px;
    margin-right: 12px;
  }

  .feature-info {
    flex: 1;
  }

  .feature-name {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .feature-description {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.4;
  }

  .feature-status {
    font-size: 16px;
  }

  .limit-info {
    margin-top: 8px;
  }

  .limit-bar {
    width: 100%;
    height: 4px;
    background: #2a2a2a;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 4px;
  }

  .limit-progress {
    height: 100%;
    background: linear-gradient(90deg, #4ade80, #22c55e);
    transition: width 0.3s ease;
  }

  .limit-text {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
  }

  .usage-stats {
    margin: 24px 0;
    padding: 16px;
    background: #1a1a1a;
    border-radius: 8px;
    border: 1px solid #2a2a2a;
  }

  .usage-stats h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
  }

  .usage-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
  }

  .usage-icon {
    font-size: 16px;
    margin-right: 12px;
  }

  .usage-info {
    flex: 1;
  }

  .usage-name {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 2px;
  }

  .usage-numbers {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
  }

  .usage-numbers span {
    margin-right: 12px;
  }

  .upgrade-section, .premium-section {
    padding: 16px;
    background: #1a1a1a;
    border-radius: 8px;
    border: 1px solid #2a2a2a;
    text-align: center;
  }

  .upgrade-section h3, .premium-section h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .upgrade-benefits {
    margin: 16px 0;
    text-align: left;
  }

  .benefit {
    padding: 4px 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }

  .upgrade-actions, .premium-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 16px;
  }

  .premium-btn, .secondary-btn, .danger-btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .premium-btn {
    background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
    color: white;
  }

  .premium-btn:hover {
    background: linear-gradient(135deg, #ff5252, #ff7979);
    transform: translateY(-1px);
  }

  .secondary-btn {
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid #2a2a2a;
  }

  .secondary-btn:hover {
    background: #2a2a2a;
    color: #f5f5f5;
  }

  .danger-btn {
    background: transparent;
    color: #ff6b6b;
    border: 1px solid #ff6b6b;
  }

  .danger-btn:hover {
    background: rgba(255, 107, 107, 0.1);
  }
`;
