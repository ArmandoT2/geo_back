const http = require('http');

// Función para probar el endpoint de cancelar alerta
function testCancelarAlerta() {
    const alertaId = 'test-id-123'; // ID de prueba
    const data = JSON.stringify({});
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/alertas/${alertaId}/cancelar`,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        let responseBody = '';
        res.on('data', (chunk) => {
            responseBody += chunk;
        });
        
        res.on('end', () => {
            console.log('Response Body:', responseBody);
            
            if (res.statusCode === 200) {
                console.log('✅ Endpoint funciona correctamente');
            } else {
                console.log('❌ Endpoint tiene problemas');
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Error de conexión:', error.message);
        console.log('🔧 Asegúrate de que el servidor backend esté ejecutándose');
        console.log('   Comando: node index.js');
    });

    req.write(data);
    req.end();
}

console.log('🧪 Probando endpoint de cancelar alerta...');
console.log('🌐 URL: http://localhost:3000/api/alertas/test-id-123/cancelar');
testCancelarAlerta();
