-- 0005 : memes moyens de paiement que la plateforme de traduction GBM
-- (manuels, verification par l'administration) : Flooz, Orabank, Zelle,
-- Wells Fargo. 'tmoney' et 'bank_transfer' restent pour plus tard.

alter type payment_method add value if not exists 'orabank';
alter type payment_method add value if not exists 'zelle';
alter type payment_method add value if not exists 'wells';
