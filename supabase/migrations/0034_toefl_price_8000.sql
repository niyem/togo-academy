-- 0034 : prix de la formule TOEFL fixe a 8 000 FCFA/an (au lieu de 5 000).
update plans set price_xof = 8000 where slug = 'toefl-annuel';
