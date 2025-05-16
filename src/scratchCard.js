class ScratchCard {
    constructor(element) {
        this.element = element;
        this.isScratched = false;
        this.couponCode = '';
        this.init();
    }

    init() {
        this.element.addEventListener('mousedown', this.startScratch.bind(this));
        this.element.addEventListener('touchstart', this.startScratch.bind(this));
    }

    startScratch(event) {
        if (!this.isScratched) {
            this.isScratched = true;
            this.revealCoupon();
        }
    }

    revealCoupon() {
        this.couponCode = this.generateCoupon();
        this.element.innerHTML = `<div class="coupon">Your coupon code: ${this.couponCode}</div>`;
        // Here you would also call a function to save the session data
    }

    generateCoupon() {
        // Placeholder for coupon generation logic
        return 'COUPON-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
}

export default ScratchCard;