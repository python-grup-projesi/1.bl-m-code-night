// agent-service/utils/retry.js

/**
 * Belirli bir işlemi, başarılı olana kadar tekrar dener.
 * @param {function} fn - Tekrar denenecek asenkron fonksiyon
 * @param {number} maxAttempts - Maksimum deneme sayısı
 */
const withRetry = async (fn, maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`[RETRY] İşlem denemesi: ${attempt}/${maxAttempts}`);
            return await fn(); // Fonksiyon başarılı olursa sonucu dön ve çık

        } catch (error) {
            console.error(`[HATA] Deneme ${attempt} başarısız: ${error.message}`);
            
            // Eğer son deneme ise, hatayı fırlat
            if (attempt === maxAttempts) {
                console.error("[GRACEFUL FAIL] Tüm denemeler başarısız oldu. Hata fırlatılıyor.");
                throw error;
            }

            // Exponential Backoff (Üstel Geri Çekilme): 
            // 1. denemede 100ms, 2. denemede 200ms, 3. denemede 400ms bekle
            const delay = 100 * Math.pow(2, attempt - 1);
            console.log(`[RETRY] ${delay}ms bekleniyor...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

module.exports = { withRetry };