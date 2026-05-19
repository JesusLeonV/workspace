const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const ejs = require('ejs'); 
const db = require('./db'); 

const app = express();
const PORT = 3000;

// Estas dos líneas le dicen a Express que procese los .html con EJS
app.engine('html', ejs.renderFile); 
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 

// Archivos estáticos con rutas absolutas
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/img', express.static(path.join(__dirname, 'img')));

// --- 2. RUTAS GET (Mostrar páginas) ---

app.get('/', (req, res) => {
    const usuario = req.cookies.username || "Invitado";
    res.render('index', { nombreUsuario: usuario }); 
});

app.get('/login', (req, res) => {
    res.render('login'); 
});

app.get('/agradecimiento', (req, res) => {
    res.render('agradecimiento');
});

app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.redirect('/');
});

// --- 3. RUTAS POST (Procesar datos) ---

// Procesar Inicio de Sesión
app.post('/procesar_login', async (req, res) => {
    const { email, contrasena } = req.body; 

    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ? AND password = ?', [email, contrasena]);

        if (rows.length > 0) {
            const nombreReal = rows[0].nombre; 
            res.cookie('username', nombreReal, { maxAge: 900000, httpOnly: true });
            res.redirect('/'); 
        } else {
            res.send('Usuario o contraseña incorrectos. <a href="/login">Volver a intentar</a>');
        }
    } catch (error) {
        console.error("Error en DB:", error);
        res.status(500).send('Error crítico al conectar con la base de datos.');
    }
});

// CORREGIDO: Procesar Registro de Opiniones (Formulario de Agradecimiento)
app.post('/registrar', async (req, res) => {
    const { nombre, correo, asunto } = req.body;
    
    try {
        // Ajusta los nombres de tus columnas según tu tabla 'opiniones' o 'contactos'
        await db.query('INSERT INTO opiniones (nombre, correo, asunto) VALUES (?, ?, ?)', [nombre, correo, asunto]);
        
        // Redirige o muestra un mensaje de éxito
        res.send('<script>alert("¡Información enviada gracias por tu ayuda!"); window.location.href="/";</script>');
    } catch (error) {
        console.error("Error al guardar en DB:", error);
        res.status(500).send('Error crítico al guardar tu opinión.');
    }
});

// --- 4. LANZAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`\n✅ Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`📁 Carpeta de vistas: ${path.join(__dirname, 'views')}`);
});