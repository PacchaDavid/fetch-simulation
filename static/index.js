// Frontend adapted to call server-side API endpoints

document.addEventListener('DOMContentLoaded', () => {
  cargarUsuarios();
});

async function cargarUsuarios() {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Error al obtener usuarios');
    const datos = await res.json();
    renderizarTabla(datos);
  } catch (err) {
    console.error(err);
    alert('No se pudieron cargar los usuarios: ' + err.message);
  }
}

function renderizarTabla(datos) {
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = '';

  datos.forEach(usuario => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${usuario.id}</td>
      <td>${usuario.name}</td>
      <td>${usuario.email}</td>
      <td>
        <button class="btn-edit" onclick="prepararEdicion(${usuario.id})">Editar</button>
        <button class="btn-danger" onclick="eliminarUsuario(${usuario.id})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

async function guardarUsuario() {
  const idInput = document.getElementById('userId').value;
  const nameInput = document.getElementById('userName').value.trim();
  const emailInput = document.getElementById('userEmail').value.trim();

  if (!nameInput || !emailInput) {
    alert('Por favor llena todos los campos');
    return;
  }

  try {
    if (idInput) {
      // Update
      const res = await fetch(`/api/users/${idInput}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: nameInput, email: emailInput})
      });
      if (!res.ok) throw new Error('Error al actualizar');
    } else {
      // Create
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: nameInput, email: emailInput})
      });
      if (!res.ok) throw new Error('Error al crear usuario');
    }

    limpiarFormulario();
    cargarUsuarios();
  } catch (err) {
    console.error(err);
    alert('Error: ' + err.message);
  }
}

async function eliminarUsuario(id) {
  if (!confirm('¿Estás seguro de eliminar este registro?')) return;
  try {
    const res = await fetch(`/api/users/${id}`, {method: 'DELETE'});
    if (!res.ok) throw new Error('Error al eliminar');
    cargarUsuarios();
  } catch (err) {
    console.error(err);
    alert('No se pudo eliminar: ' + err.message);
  }
}

async function prepararEdicion(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error('Usuario no encontrado');
    const usuario = await res.json();
    document.getElementById('userId').value = usuario.id;
    document.getElementById('userName').value = usuario.name;
    document.getElementById('userEmail').value = usuario.email;

    document.getElementById('formTitle').innerText = 'Editar Usuario #' + id;
    document.getElementById('btnSave').innerText = 'Actualizar';
    document.getElementById('btnSave').classList.remove('btn-primary');
    document.getElementById('btnSave').classList.add('btn-edit');
    document.getElementById('btnCancel').style.display = 'inline-block';
  } catch (err) {
    console.error(err);
    alert('No se pudo preparar edición: ' + err.message);
  }
}

function limpiarFormulario() {
  document.getElementById('userId').value = '';
  document.getElementById('userName').value = '';
  document.getElementById('userEmail').value = '';

  document.getElementById('formTitle').innerText = 'Agregar Nuevo Usuario';
  document.getElementById('btnSave').innerText = 'Guardar Usuario';
  document.getElementById('btnSave').classList.add('btn-primary');
  document.getElementById('btnSave').classList.remove('btn-edit');
  document.getElementById('btnCancel').style.display = 'none';
}

async function generarUsuario() {
  try {
    document.getElementById('btnGenerate').disabled = true;
    const res = await fetch('/api/generate', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({results:1})});
    if (!res.ok) throw new Error('Error al generar usuario');
    await cargarUsuarios();
  } catch (err) {
    console.error(err);
    alert('No se pudo generar usuario: ' + err.message);
  } finally {
    document.getElementById('btnGenerate').disabled = false;
  }
}