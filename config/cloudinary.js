const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary yapılandırması
// (Gerekli değişkenler .env dosyasından alınır)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Storage yapılandırması
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Dosyanın asıl uzantısını belirleyelim
    const extension = file.originalname.split('.').pop();
    const originalName = file.originalname.replace(`.${extension}`, '');
    
    // Cloudinary'de desteklenen format listesine uymuyorsa raw (herhangi bir dosya) olarak kaydedebiliriz
    // Ancak resource_type 'auto' diyerek Cloudinary'nin kendisinin karar vermesini sağlamak en iyisidir.
    return {
      folder: 'kanban_attachments',
      public_id: `${originalName}_${Date.now()}`,
      resource_type: 'auto'
    };
  }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
