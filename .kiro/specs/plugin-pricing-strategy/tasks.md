# Implementation Plan

- [ ] 1. Set up enhanced pricing infrastructure and core interfaces
  - Create new TypeScript interfaces for pricing system in `src/types.ts`
  - Define PricingManager, FeatureGateSystem, UsageTracker, and TrialManager interfaces
  - Add enhanced license state and pricing configuration types
  - _Requirements: 1.1, 1.2, 8.1_

- [ ] 2. Implement core PricingManager class
  - Create `src/pricing-manager.ts` with central pricing orchestration logic
  - Implement user tier determination based on license type (free, trial, pro_onetime, pro_subscription)
  - Add methods for checking feature access and generating pricing options
  - Integrate with existing LemonSqueezyService for license validation
  - _Requirements: 1.1, 1.2, 1.6_

- [ ] 3. Create flexible payment model configuration system
  - Create `src/pricing-config.ts` with configurable pricing options
  - Implement support for both one-time purchase and subscription variants
  - Add pricing option definitions with features, benefits, and Lemon Squeezy variant IDs
  - Create helper functions for switching between payment models
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 4. Implement FeatureGateSystem for access control
  - Create `src/feature-gate.ts` with feature access validation logic
  - Implement feature checking methods that return detailed access results
  - Add upgrade message generation with appropriate pricing options
  - Create feature definitions with tier assignments and usage limits
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 5. Build UsageTracker for monitoring and limits
  - Create `src/usage-tracker.ts` with usage monitoring and limit enforcement
  - Implement daily, monthly, and total usage tracking with Figma storage persistence
  - Add usage limit checking and enforcement logic
  - Create usage reset mechanisms for daily and monthly cycles
  - _Requirements: 2.2, 2.5, 5.1, 5.2_

- [ ] 6. Implement TrialManager for free trial system
  - Create `src/trial-manager.ts` with trial lifecycle management
  - Implement trial eligibility checking (first-time users only)
  - Add trial activation, status tracking, and expiration handling
  - Create trial-to-paid conversion flow integration
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7. Enhance LemonSqueezyService for flexible payment models
  - Extend existing `src/lemon-squeezy.ts` to support multiple product variants
  - Add methods for generating checkout URLs for different payment models
  - Implement enhanced license validation that distinguishes between one-time and subscription licenses
  - Add subscription status checking with proper expiration handling
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 8. Create enhanced pricing UI components
  - Update `src/ui.ts` with new pricing panel functionality
  - Implement pricing comparison display showing Free vs Pro features
  - Add payment model selection UI (one-time vs subscription options)
  - Create trial status indicators and countdown displays
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 9. Build contextual upgrade prompt system
  - Create upgrade prompt components that trigger when users hit feature limits
  - Implement smart upgrade messaging based on user's current usage patterns
  - Add upgrade prompt tracking to prevent over-prompting
  - Create seamless upgrade flow that opens appropriate Lemon Squeezy checkout
  - _Requirements: 2.1, 2.4, 4.3, 7.3_

- [ ] 10. Implement enhanced settings and subscription management
  - Extend existing settings modal with comprehensive subscription management
  - Add license key input and validation with support for both payment models
  - Implement subscription status display with renewal dates and payment info
  - Create subscription management links to Lemon Squeezy customer portal
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 11. Add onboarding and value communication system
  - Create onboarding tour that highlights premium features with tier indicators
  - Implement feature discovery system that shows premium capabilities
  - Add trial offer presentation during onboarding with clear terms
  - Create value proposition messaging throughout the UI
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 12. Implement offline support and error handling
  - Add cached license status with grace period handling for network issues
  - Implement fallback mechanisms for API failures with user-friendly messaging
  - Create license validation retry logic with exponential backoff
  - Add error recovery strategies for different failure scenarios
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 13. Create usage analytics and tracking system
  - Implement privacy-respecting usage analytics collection
  - Add feature usage tracking with opt-out capability
  - Create conversion funnel tracking for upgrade optimization
  - Implement analytics data export for business insights
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 14. Build comprehensive testing suite
  - Create unit tests for PricingManager, FeatureGateSystem, UsageTracker, and TrialManager
  - Implement integration tests for Lemon Squeezy API interactions
  - Add UI component tests for pricing panels and upgrade flows
  - Create end-to-end tests for complete user journeys (free to trial to paid)
  - _Requirements: All requirements validation_

- [ ] 15. Integrate and wire all components together
  - Connect PricingManager to existing plugin initialization in `src/code.ts`
  - Wire feature gates into existing plugin functionality (bookmarks, emoji sets, etc.)
  - Integrate usage tracking into all relevant user actions
  - Connect UI components to pricing system with proper message handling
  - _Requirements: All requirements integration_

- [ ] 16. Add configuration and deployment preparation
  - Create configuration system for easy pricing model switching
  - Add environment-based configuration for development vs production
  - Implement pricing model migration utilities for existing users
  - Create deployment checklist and testing procedures
  - _Requirements: 8.5, 9.1_