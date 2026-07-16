-- 0021 : nouveau role 'tutor' (tuteur humain, tutorat en direct payant).
-- ALTER TYPE ... ADD VALUE doit etre applique seul, avant toute utilisation
-- de la valeur (Postgres refuse de l'utiliser dans la meme transaction).

alter type user_role add value if not exists 'tutor';
