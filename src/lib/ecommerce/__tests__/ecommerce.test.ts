import { describe, it, expect, beforeEach } from 'vitest';
import { FormulationMatcher } from '../catalog/matcher';
import { VaidyanathSupplierAdapter } from '../fulfillment/vaidyanathAdapter';
import { CartService } from '../services/cartService';
import { CheckoutService } from '../services/checkoutService';
import { AYURVEDIC_CATALOG } from '../catalog/catalogData';

describe('Healio.AI E-Commerce & Product Integration Tests', () => {
  let matcher: FormulationMatcher;
  let vaidyanathAdapter: VaidyanathSupplierAdapter;
  let checkoutService: CheckoutService;

  beforeEach(() => {
    matcher = new FormulationMatcher(AYURVEDIC_CATALOG);
    vaidyanathAdapter = new VaidyanathSupplierAdapter({ isTestMode: true });
    checkoutService = new CheckoutService(vaidyanathAdapter);
  });

  describe('Formulation-to-SKU Matcher', () => {
    it('should match a classical formulation name to Vaidyanath catalog SKU', () => {
      const matches = matcher.matchRecommendations({
        diagnosticId: 'diag_test_101',
        recommendedFormulations: ['Avipattikar Churna'],
        patientVikriti: 'pitta'
      });

      expect(matches.length).toBeGreaterThan(0);
      const topMatch = matches[0];
      expect(topMatch.product.sku).toBe('VDN-AVP-100G');
      expect(topMatch.product.brand).toBe('Vaidyanath Group');
      expect(topMatch.isSafe).toBe(true);
      expect(topMatch.traceability.diagnosticId).toBe('diag_test_101');
      expect(topMatch.traceability.targetDosha).toBe('pitta');
      expect(topMatch.traceability.anupana).toBe('lukewarm water');
    });

    it('should boost match score for formulations that pacify patient Vikriti', () => {
      // Ashwagandha pacifies Vata
      const vataPatientMatches = matcher.matchRecommendations({
        diagnosticId: 'diag_test_102',
        recommendedFormulations: ['Ashwagandharishta'],
        patientVikriti: 'vata'
      });

      expect(vataPatientMatches[0].product.ayurvedicMetadata.doshaTarget.pacifies).toContain('vata');
      expect(vataPatientMatches[0].matchScore).toBeGreaterThan(70);
    });

    it('should flag clinical contraindications and mark isSafe as false', () => {
      // Lavan Bhaskar Churna is contraindicated in hypertension (high sodium)
      const matches = matcher.matchRecommendations({
        diagnosticId: 'diag_test_103',
        recommendedFormulations: ['Lavan Bhaskar Churna'],
        patientVikriti: 'vata',
        patientConditions: ['hypertension']
      });

      expect(matches.length).toBeGreaterThan(0);
      const lavanMatch = matches.find(m => m.product.sku === 'VDN-LAVAN-100G');
      expect(lavanMatch).toBeDefined();
      expect(lavanMatch?.isSafe).toBe(false);
      expect(lavanMatch?.safetyAlerts.some(a => a.includes('CONTRAINDICATED'))).toBe(true);
    });

    it('should identify Schedule E-1 regulated formulations requiring prescription', () => {
      const matches = matcher.matchRecommendations({
        diagnosticId: 'diag_test_104',
        recommendedFormulations: ['Agnitundi Vati'],
        patientVikriti: 'kapha'
      });

      const agnitundiMatch = matches.find(m => m.product.sku === 'VDN-AGNIT-80TAB');
      expect(agnitundiMatch).toBeDefined();
      expect(agnitundiMatch?.requiresPrescription).toBe(true);
    });
  });

  describe('Vaidyanath Supplier Adapter', () => {
    it('should generate properly tagged affiliate fallback URLs', () => {
      const product = AYURVEDIC_CATALOG[0];
      const link = vaidyanathAdapter.generateAffiliateLink(product, 'custom_campaign_ref');

      expect(link).toContain('ref=custom_campaign_ref');
      expect(link).toContain('utm_source=healio_ai');
    });

    it('should return valid inventory status in test mode', async () => {
      const inventory = await vaidyanathAdapter.checkInventory(['VDN-AVP-100G']);
      const status = inventory.get('VDN-AVP-100G');

      expect(status).toBeDefined();
      expect(status?.inStock).toBe(true);
      expect(status?.availableQuantity).toBeGreaterThan(0);
    });
  });

  describe('Cart Service', () => {
    it('should correctly calculate subtotal, shipping fee threshold, and total', () => {
      let cart = CartService.createEmptyCart('user_123');
      const product = AYURVEDIC_CATALOG[0]; // Price: ₹175

      // 1 item (₹175 < ₹499 threshold) -> Shipping should be ₹60
      cart = CartService.addItem(cart, product, 1);
      expect(cart.subtotalInINR).toBe(175);
      expect(cart.shippingInINR).toBe(60);
      expect(cart.totalInINR).toBe(235);

      // 3 items (₹525 > ₹499 threshold) -> Shipping should be free (₹0)
      cart = CartService.updateQuantity(cart, product.id, 3);
      expect(cart.subtotalInINR).toBe(525);
      expect(cart.shippingInINR).toBe(0);
      expect(cart.totalInINR).toBe(525);
    });

    it('should flag cart when a Schedule E-1 item is added', () => {
      let cart = CartService.createEmptyCart('user_123');
      const regularProduct = AYURVEDIC_CATALOG[0]; // Avipattikar (OTC)
      const scheduleE1Product = AYURVEDIC_CATALOG.find(p => p.ayurvedicMetadata.isScheduleE1)!;

      cart = CartService.addItem(cart, regularProduct, 1);
      expect(cart.requiresPrescriptionAudit).toBe(false);

      cart = CartService.addItem(cart, scheduleE1Product, 1);
      expect(cart.requiresPrescriptionAudit).toBe(true);
    });
  });

  describe('Checkout Service & Order Lifecycle', () => {
    it('should create order and dispatch dropship to Vaidyanath Logistics upon payment', async () => {
      let cart = CartService.createEmptyCart('user_test_99');
      const vdnProduct = AYURVEDIC_CATALOG[0];
      cart = CartService.addItem(cart, vdnProduct, 2);

      const address = {
        fullName: 'Aarav Sharma',
        street: '42 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '+919988776655',
        email: 'aarav@example.com'
      };

      const order = await checkoutService.createOrder(cart, address, { paymentMethod: 'RAZORPAY' });
      expect(order.id).toBeDefined();
      expect(order.status).toBe('PENDING_PAYMENT');
      expect(order.supplierDispatches.length).toBe(1);
      expect(order.supplierDispatches[0].supplierId).toBe('VAIDYANATH_GROUP');

      // Simulate payment confirmation
      const confirmedOrder = await checkoutService.confirmPaymentAndDispatch(order.id, 'razorpay_pay_abc123');
      expect(confirmedOrder.paymentStatus).toBe('PAID');
      expect(confirmedOrder.status).toBe('FULFILLMENT_REQUESTED');
      expect(confirmedOrder.supplierDispatches[0].status).toBe('ACCEPTED');
      expect(confirmedOrder.supplierDispatches[0].trackingNumber).toBeDefined();
      expect(confirmedOrder.supplierDispatches[0].carrierName).toContain('Blue Dart');
    });
  });
});
