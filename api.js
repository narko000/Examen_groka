const fs = require("fs");
const express = require("express");
const pc = require("picocolors");
const port = 4567;
const app = express();
const juegos = require("./DATOS_API/juegos.json");
const compras = require("./DATOS_API/compras.json");
app.use(express.json());

app.use((req, res, next) => {
    res.on("finish", () => {
        const status = res.statusCode;
        const color = status < 400 ? pc.green(status) : pc.red(status);
        console.log(`[${pc.cyan(req.method)}] ${req.url} -> ${color}`);
    });
    next();
});

app.get("/api/juegos", (req, res) => {
    res.json(juegos);
});

app.get("/api/juegos/:id", (req, res) => {
    const id = Number(req.params.id);
    const juego = juegos.find(j => j.id === id);
    if (!juego) {
        return res.status(404).json({ error: "Not found" });
    }
    res.json(juego);
});

app.post("/api/juegos", (req, res) => {
    const nuevo = {
        id: juegos.length === 0 ? 1 : Math.max(...juegos.map(j => j.id)) + 1,
        titulo: req.body.titulo,
        desarrollador: req.body.desarrollador,
        anio: req.body.anio,
        genero: req.body.genero,
        precio: req.body.precio,
        retirado: false,
        copiasVendidas: 0
    };
    juegos.push(nuevo);
    fs.writeFileSync("./DATOS_API/juegos.json", JSON.stringify(juegos, null, 2));
    res.status(201).json(nuevo);
});

app.put("/api/juegos/:id", (req, res) => {
    const id = Number(req.params.id);
    const index = juegos.findIndex(j => j.id === id);
    if (index === -1) {
        return res.status(404).json({ error: "Not found" });
    }
    juegos[index].titulo = req.body.titulo;
    juegos[index].desarrollador = req.body.desarrollador;
    juegos[index].anio = req.body.anio;
    juegos[index].genero = req.body.genero;
    juegos[index].precio = req.body.precio;
    fs.writeFileSync("./DATOS_API/juegos.json", JSON.stringify(juegos, null, 2));
    res.json(juegos[index]);
});

app.delete("/api/juegos/titulo/:titulo", (req, res) => {
    const index = juegos.findIndex(j => j.titulo === req.params.titulo);
    if (index === -1) {
        return res.status(404).json({ error: "Not found" });
    }
    const id = juegos[index].id;
    if (compra) {
        return res.status(409).json({ error: "Tiene una compra activa" });
    }
    juegos.splice(index, 1);
    fs.writeFileSync("./DATOS_API/juegos.json", JSON.stringify(juegos, null, 2));
    res.json({ mensaje: "Juego eliminado" });
});

app.delete("/api/juegos/:id", (req, res) => {
    const id = Number(req.params.id);
    const index = juegos.findIndex(j => j.id === id);
    if (index === -1) {
        return res.status(404).json({ error: "Not found" });
    }
    if (compra) {
        return res.status(409).json({ error: "Tiene una compra activa" });
    }
    juegos.splice(index, 1);
    fs.writeFileSync("./DATOS_API/juegos.json", JSON.stringify(juegos, null, 2));
    res.json({ mensaje: "Juego eliminado" });
});

app.get("/api/compras", (req, res) => {
    res.json(compras);
});

app.get("/api/compras/:titulo", (req, res) => {
    const juego = juegos.find(j => j.titulo === req.params.titulo);
    if (!juego) {
        return res.status(404).json({ error: "Not found" });
    }
    res.json(compras.filter(c => c.juegoId === juego.id));
});

app.post("/api/compras", (req, res) => {
    const juego = juegos.find(j => j.id === req.body.juegoId);
    if (!juego) {
        return res.status(404).json({ error: "Not found" });
    }
    if (juego.retirado) {
        return res.status(409).json({ error: "Juego retirado" });
    }
    if (compra) {
        return res.status(409).json({ error: "Ya tiene una compra activa" });
    }
    const nueva = {
        codigo: "C" + String(compras.length + 1).padStart(3, "0"),
        juegoId: req.body.juegoId,
        usuario: req.body.usuario,
        fecha: req.body.fecha,
        estado: "Activa"
    };
    compras.push(nueva);
    juego.copiasVendidas = juego.copiasVendidas + 1;
    fs.writeFileSync("./DATOS_API/compras.json", JSON.stringify(compras, null, 2));
    fs.writeFileSync("./DATOS_API/juegos.json", JSON.stringify(juegos, null, 2));
    res.status(201).json(nueva);
});

app.put("/api/compras/:codigo/reembolsar", (req, res) => {
    const compra = compras.find(c => c.codigo === req.params.codigo);
    if (!compra) {
        return res.status(404).json({ error: "Not found" });
    }
    if (compra.estado === "Reembolsada") {
        return res.status(409).json({ error: "Reembolsado" });
    }
    compra.estado = "Reembolsada";
    const juego = juegos.find(j => j.id === compra.juegoId);
    juego.copiasVendidas = juego.copiasVendidas - 1;
    fs.writeFileSync("./DATOS_API/juegos.json", JSON.stringify(juegos, null, 2));
    fs.writeFileSync("./DATOS_API/compras.json", JSON.stringify(compras, null, 2));
    res.json(compra);
});

app.use((req, res) => {
    res.status(404).send("Error 404 Page Not Found");
});

app.listen(port, () => {
    console.log(pc.green(`Servidor escuchando en http://localhost:${port}`));
});
