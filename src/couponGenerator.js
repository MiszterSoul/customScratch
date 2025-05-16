function generateCoupon() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let couponCode = '';
    const couponLength = 10; // Length of the coupon code

    for (let i = 0; i < couponLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        couponCode += characters[randomIndex];
    }

    return couponCode;
}

module.exports = generateCoupon;