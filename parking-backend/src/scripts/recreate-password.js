// recreate-password.js
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const newPassword = 'jhont123';
  const hash = await bcrypt.hash(newPassword, 10);
  console.log('Nuevo hash:', hash);
}

async function testPassword() {
  const hashFromDB = '$2b$10$pRkJ0HDf/F7pe21UgCbOTuxXVkKd9xP7srKtrQnD5Zbb42eVZRU0.';
  const password = 'jhont123';
  bcrypt.compare(password, hashFromDB).then(result => {
    console.log('¿Contraseña coincide?', result);
    console.log('Hash en BD:', hashFromDB);
    console.log('Password probado:', password);
  });
}

//testPassword();
//resetPassword();
// admin123 - $2b$10$C.r1XnEuu3xpuLqUXDvi9.3g0qmyN97POvipGoOr/huw5s5eNk3UW
// jeimy123 - $2b$10$pR8chnx2VBTZeXv7q3AeMOgFQDAFn25zjR7AmPBtf/PxMUO/kHMjO
// opera123 - $2b$10$zK8wPuMHX5F2phDYUyLmBuCSO9F2tMasZjA.xVdBJZ8sJJIh/fmjC
// johnt123 - $2b$10$pRkJ0HDf/F7pe21UgCbOTuxXVkKd9xP7srKtrQnD5Zbb42eVZRU0.
