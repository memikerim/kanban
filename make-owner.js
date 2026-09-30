require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeOwner() {
    const email = process.argv[2];
    if (!email) {
        console.error("Lütfen bir e-posta adresi girin. Kullanım: node make-owner.js <email>");
        process.exit(1);
    }

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'owner' }
        });
        console.log(`✅ Başarılı! ${user.name} (${user.email}) artık OWNER (Sahip) yetkisine sahip.`);
    } catch (error) {
        console.error("Hata oluştu:", error.meta?.cause || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

makeOwner();
