const fs = require('fs');

let content = "export const TAROT_IMAGES: Record<number, any> = {\n";
for (let i = 0; i < 78; i++) {
    content += `  ${i}: require('../public/tarot/${i + 6}.png'),\n`;
}
content += "};\n";

fs.writeFileSync('utils/tarotImages.ts', content);
