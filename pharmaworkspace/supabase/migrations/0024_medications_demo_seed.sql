-- Référentiel minimal pour tester ruptures (signalement + scan CIP13).
-- N’insère rien si la table contient déjà des lignes.

INSERT INTO public.medications (cip13, name, dosage, form, laboratory, active)
SELECT v.cip13, v.name, v.dosage, v.form, v.laboratory, true
FROM (
  VALUES
    ('3400931398339', 'DOLIPRANE 1000 MG', '1000 mg', 'Comprimé', 'SANOFI'),
    ('3400933493917', 'DOLIPRANE 500 MG', '500 mg', 'Comprimé', 'SANOFI'),
    ('3400933493909', 'DOLIPRANE 1000 MG', '1000 mg', 'Comprimé effervescent', 'SANOFI'),
    ('3400933493925', 'SPASFON LYOC 80 MG', '80 mg', 'Lyoc', 'TEVA'),
    ('3400933493933', 'SMECTA 3 G', '3 g', 'Poudre pour suspension buvable', 'IPSEN'),
    ('3400933493941', 'IBUPROFENE 400 MG', '400 mg', 'Comprimé', 'GENERIQUE'),
    ('3400933493958', 'AERIUS 5 MG', '5 mg', 'Comprimé', 'ORGANON'),
    ('3400933493966', 'AUGMENTIN 1 G', '1 g', 'Comprimé', 'GSK'),
    ('3400933493974', 'VENTOLINE 100 MCG', '100 mcg/dose', 'Spray', 'GSK'),
    ('3400933493982', 'OMEPRAZOLE 20 MG', '20 mg', 'Gélule', 'GENERIQUE')
) AS v(cip13, name, dosage, form, laboratory)
WHERE NOT EXISTS (SELECT 1 FROM public.medications LIMIT 1);
