let db = null;
let SQL = null;

// Función para obtener todas las tablas y sus columnas desde la BD
function cargarEsquema() {
    if (!db) return;
    try {
        // Obtener lista de tablas del sqlite_master
        const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
        const tables = [];
        while (stmt.step()) {
            tables.push(stmt.get()[0]);
        }
        stmt.free();
        
        let html = '';
        for (let table of tables) {
            // Obtener columnas de cada tabla
            const pragma = db.prepare(`PRAGMA table_info(${table})`);
            const columns = [];
            while (pragma.step()) {
                const col = pragma.get();
                columns.push({ name: col[1], type: col[2] });
            }
            pragma.free();
            
            html += `<div class="schema-table">
                        <strong>📌 ${table}</strong>
                        <ul>`;
            for (let col of columns) {
                html += `<li>• ${col.name} (${col.type || 'TEXT'})</li>`;
            }
            html += `</ul></div>`;
        }
        document.getElementById('schemaContent').innerHTML = html || '<p>No se encontraron tablas.</p>';
    } catch (err) {
        console.error(err);
        document.getElementById('schemaContent').innerHTML = '<p>Error al cargar esquema.</p>';
    }
}

async function initDatabase() {
    const statusDiv = document.getElementById('schemaStatus');
    statusDiv.innerHTML = '🔄 Preparando entorno de validación...';
    try {
        SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
        db = new SQL.Database();
        
        // Crear todas las tablas (exactamente las de los ejercicios)
        db.run(`CREATE TABLE DEPART (DEPT_NO NUMBER(2) primary key, DNOMBRE VARCHAR2(14), LOC VARCHAR2(14))`);
        db.run(`CREATE TABLE EMPLE (EMP_NO NUMBER(4) primary key, APELLIDO VARCHAR2(10), OFICIO VARCHAR2(10), DIR NUMBER(4), FECHA_ALT DATE, SALARIO NUMBER(10), COMISION NUMBER(10), DEPT_NO NUMBER(2))`);
        db.run(`CREATE TABLE NOTAS_ALUMNOS (NOMBRE_ALUMNO VARCHAR2(25), nota1 NUMBER(2), nota2 NUMBER(2), nota3 NUMBER(2))`);
        db.run(`CREATE TABLE LIBRERIA (TEMA CHAR(15), ESTANTE CHAR(1), EJEMPLARES NUMBER(2))`);
        db.run(`CREATE TABLE ALUMNOS (DNI VARCHAR2(10), APENOM VARCHAR2(30), DIREC VARCHAR2(30), POBLA VARCHAR2(15), TELEF VARCHAR2(10))`);
        db.run(`CREATE TABLE ASIGNATURAS (COD NUMBER(2), NOMBRE VARCHAR2(25))`);
        db.run(`CREATE TABLE NOTAS (DNI VARCHAR2(10), COD NUMBER(2), NOTA NUMBER(2))`);
        
        // Insertar algunos registros ficticios (opcional, solo para que el validador no dé error de tabla vacía)
        // No es necesario para validar, pero lo dejamos para completar.
        statusDiv.innerHTML = '✅ Validador listo. Puedes consultar el esquema (tablas y columnas) con el botón de abajo.';
        statusDiv.style.background = '#1e4a2f';
        
        // Cargar el esquema visual por primera vez
        cargarEsquema();
    } catch (err) {
        statusDiv.innerHTML = '❌ Error al cargar validador: ' + err.message;
        statusDiv.style.background = '#5a1e1e';
    }
}

function analizarEstructura(sql) {
    const sqlUpper = sql.toUpperCase();
    const tieneJoin = /\b(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|JOIN)\b/.test(sqlUpper);
    const tieneSubconsulta = /\(\s*SELECT\b/i.test(sqlUpper);
    const tieneGroupBy = /\bGROUP\s+BY\b/.test(sqlUpper);
    const tieneOrderBy = /\bORDER\s+BY\b/.test(sqlUpper);
    const tieneFuncionAgregado = /\b(COUNT|SUM|AVG|MAX|MIN)\s*\(/i.test(sqlUpper);
    
    return { tieneJoin, tieneSubconsulta, tieneGroupBy, tieneOrderBy, tieneFuncionAgregado };
}

function validarSintaxis(sql) {
    if (!db) return { ok: false, error: "Base de datos no inicializada" };
    try {
        const stmt = db.prepare(sql);
        stmt.free();
        return { ok: true, error: null };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

function mostrarAnalisis(sql) {
    const resultDiv = document.getElementById('resultContainer');
    if (!sql.trim()) {
        resultDiv.innerHTML = '<div class="placeholder">✏️ Escribe una consulta SQL para validar.</div>';
        return;
    }
    
    const sintaxis = validarSintaxis(sql);
    const estructura = analizarEstructura(sql);
    
    let html = '';
    
    if (sintaxis.ok) {
        html += `<div class="result-card result-correct">
                    <strong>✅ Sintaxis correcta</strong><br>
                    La consulta está bien formada.
                 </div>`;
    } else {
        html += `<div class="result-card result-error">
                    <strong>❌ Error de sintaxis</strong><br>
                    ${escapeHtml(sintaxis.error)}
                 </div>`;
        resultDiv.innerHTML = html;
        return;
    }
    
    let estructuraHtml = `<div class="result-card result-info">
                            <strong>📐 Estructura detectada:</strong><br>`;
    if (estructura.tieneJoin) estructuraHtml += `<span class="badge">🔗 JOIN</span>`;
    if (estructura.tieneSubconsulta) estructuraHtml += `<span class="badge">📦 Subconsulta (anidada)</span>`;
    if (estructura.tieneGroupBy) estructuraHtml += `<span class="badge">📊 GROUP BY</span>`;
    if (estructura.tieneOrderBy) estructuraHtml += `<span class="badge">🔽 ORDER BY</span>`;
    if (estructura.tieneFuncionAgregado) estructuraHtml += `<span class="badge">🧮 Función agregada</span>`;
    
    if (!estructura.tieneJoin && !estructura.tieneSubconsulta && !estructura.tieneGroupBy && !estructura.tieneOrderBy && !estructura.tieneFuncionAgregado) {
        estructuraHtml += `<span>Consulta simple (SELECT sin JOIN, subconsultas ni agregación).</span>`;
    }
    estructuraHtml += `</div>`;
    html += estructuraHtml;
    
    if (estructura.tieneJoin && estructura.tieneSubconsulta) {
        html += `<div class="result-card result-info">
                    <strong>💡 Nota:</strong> Tu consulta combina JOIN y subconsultas. Asegúrate de que es lo que pide el ejercicio.
                 </div>`;
    } else if (estructura.tieneJoin) {
        html += `<div class="result-card result-info">
                    <strong>💡 Nota:</strong> Esta consulta utiliza JOIN. Si el ejercicio pide subconsulta, no es equivalente.
                 </div>`;
    } else if (estructura.tieneSubconsulta) {
        html += `<div class="result-card result-info">
                    <strong>💡 Nota:</strong> Esta consulta utiliza subconsultas (anidada). Si el ejercicio pide JOIN, revisa.
                 </div>`;
    }
    
    resultDiv.innerHTML = html;
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await initDatabase();
    
    const validateBtn = document.getElementById('validateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const toggleSchemaBtn = document.getElementById('toggleSchemaBtn');
    const schemaContent = document.getElementById('schemaContent');
    const sqlEditor = document.getElementById('sqlEditor');
    const exampleBtns = document.querySelectorAll('.example-buttons button');
    
    validateBtn.addEventListener('click', () => {
        mostrarAnalisis(sqlEditor.value);
    });
    
    clearBtn.addEventListener('click', () => {
        sqlEditor.value = '';
        document.getElementById('resultContainer').innerHTML = '<div class="placeholder">Listo para validar una nueva consulta.</div>';
    });
    
    toggleSchemaBtn.addEventListener('click', () => {
        if (schemaContent.style.display === 'none') {
            schemaContent.style.display = 'block';
            toggleSchemaBtn.textContent = '📄 Ocultar tablas y columnas';
        } else {
            schemaContent.style.display = 'none';
            toggleSchemaBtn.textContent = '📂 Ver / Ocultar tablas y columnas';
        }
    });
    
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sqlQuery = btn.getAttribute('data-sql');
            if (sqlQuery) {
                sqlEditor.value = sqlQuery;
                mostrarAnalisis(sqlQuery);
            }
        });
    });
});