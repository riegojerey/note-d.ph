-- Starting data: current 21 scents and pricing

INSERT INTO settings (key, value) VALUES ('sizes', '{"10mL":{"price":119,"cost":90},"30mL":{"price":275,"cost":200}}');
INSERT INTO settings (key, value) VALUES ('low_stock', '3');
INSERT INTO settings (key, value) VALUES ('show_stock', '0');

INSERT INTO products (id, name, inspired, sort) VALUES ('acqua-profonda', 'Acqua Profonda', 'Acqua di Gio Profondo', 1);
INSERT INTO products (id, name, inspired, sort) VALUES ('fiamma', 'Fiamma', 'Versace Eros Flame', 2);
INSERT INTO products (id, name, inspired, sort) VALUES ('fluidite-douce', 'Fluidité Douce', 'Gentle Fluidity', 3);
INSERT INTO products (id, name, inspired, sort) VALUES ('rouge-cristal', 'Rouge Cristal', 'Baccarat Rouge 540', 4);
INSERT INTO products (id, name, inspired, sort) VALUES ('212', '212°', 'Carolina Herrera 212', 5);
INSERT INTO products (id, name, inspired, sort) VALUES ('corail-solaire', 'Corail Solaire', 'Bvlgari Omnia Coral', 6);
INSERT INTO products (id, name, inspired, sort) VALUES ('cristalline', 'Cristalline', 'Bvlgari Omnia Crystalline', 7);
INSERT INTO products (id, name, inspired, sort) VALUES ('sauvage-homme', 'Sauvage Homme', 'Dior Sauvage', 8);
INSERT INTO products (id, name, inspired, sort) VALUES ('azzurro-mare', 'Azzurro Mare', 'Dolce & Gabbana Light Blue', 9);
INSERT INTO products (id, name, inspired, sort) VALUES ('eclat-florale', 'Éclat Florale', 'Lanvin Éclat d''Arpège', 10);
INSERT INTO products (id, name, inspired, sort) VALUES ('merveille-bleue', 'Merveille Bleue', 'Hermès Eau des Merveilles Bleue', 11);
INSERT INTO products (id, name, inspired, sort) VALUES ('lunico', 'L''Unico', 'Dolce & Gabbana The One', 12);
INSERT INTO products (id, name, inspired, sort) VALUES ('acqua-classica', 'Acqua Classica', 'Acqua di Gio', 13);
INSERT INTO products (id, name, inspired, sort) VALUES ('blanc-frais', 'Blanc Frais', 'Lacoste L.12.12 White', 14);
INSERT INTO products (id, name, inspired, sort) VALUES ('nectarine-bloom', 'Nectarine Bloom', 'Jo Malone Nectarine Blossom & Honey', 15);
INSERT INTO products (id, name, inspired, sort) VALUES ('delina-rose', 'Delina Rose', 'Parfums de Marly Delina', 16);
INSERT INTO products (id, name, inspired, sort) VALUES ('reverie', 'Rêverie', 'Louis Vuitton Imagination', 17);
INSERT INTO products (id, name, inspired, sort) VALUES ('noir-intense', 'Noir Intense', 'YSL Y Intense', 18);
INSERT INTO products (id, name, inspired, sort) VALUES ('symphonie-doree', 'Symphonie Dorée', 'Louis Vuitton Symphony', 19);
INSERT INTO products (id, name, inspired, sort) VALUES ('voile-blanc', 'Voile Blanc', 'Parfums de Marly Valaya', 20);
INSERT INTO products (id, name, inspired, sort) VALUES ('paradosso', 'Paradosso', 'Prada Paradoxe', 21);

INSERT INTO stock (product_id, size, qty) SELECT id, '10mL', 0 FROM products;
INSERT INTO stock (product_id, size, qty) SELECT id, '30mL', 0 FROM products;
