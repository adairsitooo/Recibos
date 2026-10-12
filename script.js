"use strict";

/* JASY Service - Generador de recibos PDF */

const EMPRESA = {
  nombre: "JASY Service",
  telefono: "48012050"
};

const STORAGE_KEY = "jasyServiceUltimoRecibo";

const clienteInput = document.getElementById("cliente");
const telefonoClienteInput = document.getElementById("telefonoCliente");
const servicioInput = document.getElementById("servicio");
const fechaInput = document.getElementById("fecha");
const metodoPagoInput = document.getElementById("metodoPago");
const observacionesInput = document.getElementById("observaciones");
const montoInput = document.getElementById("monto");
const montoVista = document.getElementById("montoVista");
const numeroVista = document.getElementById("numeroVista");
const generarBtn = document.getElementById("generarBtn");
const limpiarBtn = document.getElementById("limpiarBtn");

function formatoMoneda(valor) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(valor) || 0);
}

function fechaLocalISO() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function fechaLegible(valor) {
  if (!valor) return "No especificada";
  const partes = valor.split("-");
  if (partes.length !== 3) return valor;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obtenerUltimoNumero() {
  try {
    const guardado = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(guardado) && guardado >= 0 ? guardado : 0;
  } catch (error) {
    return 0;
  }
}

function numeroRecibo(numero) {
  return `REC-${String(numero).padStart(3, "0")}`;
}

function actualizarVista() {
  montoVista.textContent = formatoMoneda(montoInput.value);
  numeroVista.textContent = numeroRecibo(obtenerUltimoNumero() + 1);
}

function limpiarNombreArchivo(nombre) {
  return nombre
    .trim()
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 70) || "Cliente";
}

function agregarLinea(doc, texto, x, y, ancho, interlineado = 4.5) {
  const lineas = doc.splitTextToSize(String(texto || ""), ancho);
  doc.text(lineas, x, y);
  return y + (lineas.length * interlineado);
}

function dibujarEtiquetaValor(doc, etiqueta, valor, x, y, anchoValor = 95) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(105, 105, 105);
  doc.text(etiqueta.toUpperCase(), x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(55, 43, 48);
  const lineas = doc.splitTextToSize(String(valor || "—"), anchoValor);
  doc.text(lineas, x, y + 6);
  return y + 7 + (lineas.length * 4);
}

montoInput.addEventListener("input", actualizarVista);

generarBtn.addEventListener("click", function () {
  const cliente = clienteInput.value.trim();
  const servicio = servicioInput.value.trim();
  const monto = Number(montoInput.value);

  if (!cliente) {
    alert("Ingrese el nombre del cliente.");
    clienteInput.focus();
    return;
  }
  if (!servicio) {
    alert("Describa el servicio realizado.");
    servicioInput.focus();
    return;
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    alert("Ingrese un monto recibido mayor que Q0.00.");
    montoInput.focus();
    return;
  }
  if (!fechaInput.value) {
    alert("Seleccione la fecha del recibo.");
    fechaInput.focus();
    return;
  }
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert(
      "No se pudo cargar el generador PDF. Compruebe su conexión a Internet y vuelva a cargar la página."
    );
    return;
  }

  const siguienteNumero = obtenerUltimoNumero() + 1;
  const recibo = numeroRecibo(siguienteNumero);
  const jsPDF = window.jspdf.jsPDF;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Cabecera
  doc.setFillColor(35, 35, 35);
  doc.roundedRect(margin, y, contentWidth, 42, 4, 4, "F");
  doc.setDrawColor(145, 145, 145);
  doc.setLineWidth(1.1);
  doc.line(margin + 6, y + 35, pageWidth - margin - 6, y + 35);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(EMPRESA.nombre, margin + 7, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Teléfono: ${EMPRESA.telefono}`, margin + 7, y + 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("RECIBO DE PAGO", pageWidth - margin - 7, y + 13, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(recibo, pageWidth - margin - 7, y + 21, { align: "right" });

  y += 55;

  // Fecha y cliente
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(35, 35, 35);
  doc.text("DETALLES DEL PAGO", margin, y);
  y += 8;

  doc.setDrawColor(215, 215, 215);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  const col2 = margin + 94;
  const fechaY = y;
  dibujarEtiquetaValor(doc, "Fecha", fechaLegible(fechaInput.value), margin, fechaY);
  dibujarEtiquetaValor(doc, "Forma de pago", metodoPagoInput.value, col2, fechaY, 70);
  y += 20;

  y = dibujarEtiquetaValor(doc, "Recibí de", cliente, margin, y, contentWidth - 5);

  if (telefonoClienteInput.value.trim()) {
    y = dibujarEtiquetaValor(doc, "Celular del cliente", telefonoClienteInput.value.trim(), margin, y);
  }

  y += 3;
  doc.setFillColor(247, 247, 247);
  doc.setDrawColor(215, 215, 215);
  doc.roundedRect(margin, y, contentWidth, 45, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(35, 35, 35);
  doc.text("EN CONCEPTO DE", margin + 7, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(55, 43, 48);
  const lineasServicio = doc.splitTextToSize(servicio, contentWidth - 14);
  doc.text(lineasServicio.slice(0, 4), margin + 7, y + 17);

  y += 57;

  // Importe destacado
  doc.setFillColor(238, 238, 238);
  doc.roundedRect(margin, y, contentWidth, 31, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(75, 75, 75);
  doc.text("MONTO RECIBIDO", margin + 7, y + 11);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.setTextColor(35, 35, 35);
  doc.text(formatoMoneda(monto), pageWidth - margin - 7, y + 20, { align: "right" });

  y += 41;

  if (observacionesInput.value.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(105, 105, 105);
    doc.text("OBSERVACIONES", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 43, 48);
    y = agregarLinea(doc, observacionesInput.value.trim(), margin, y, contentWidth, 4.5);
    y += 5;
  }

  // Constancia
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 78, 83);
  const constancia = "Este documento confirma la recepción del monto indicado por el servicio descrito.";
  y = agregarLinea(doc, constancia, margin, y, contentWidth, 4.5);
  y += 22;

  // Firma opcional en papel impreso
  const firmaWidth = 68;
  const firmaX = (pageWidth - firmaWidth) / 2;
  doc.setDrawColor(145, 145, 145);
  doc.setLineWidth(0.5);
  doc.line(firmaX, y, firmaX + firmaWidth, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(105, 105, 105);
  doc.text("Firma / recibido por", pageWidth / 2, y + 5, { align: "center" });

  // Pie
  doc.setDrawColor(145, 145, 145);
  doc.line(margin, 278, pageWidth - margin, 278);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(35, 35, 35);
  doc.text("JASY Service", margin, 285);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(105, 105, 105);
  doc.text(`Recibo ${recibo}`, pageWidth - margin, 285, { align: "right" });

  const nombreArchivo = `${recibo}_${limpiarNombreArchivo(cliente)}_${fechaInput.value}.pdf`;

  try {
    doc.save(nombreArchivo);
    // Incrementar el contador después de generar el PDF.
    try {
      localStorage.setItem(STORAGE_KEY, String(siguienteNumero));
    } catch (error) {
      console.warn("No se pudo guardar el contador en este navegador.", error);
    }
    actualizarVista();
  } catch (error) {
    console.error(error);
    alert("No se pudo guardar el PDF. Inténtelo nuevamente.");
  }
});

limpiarBtn.addEventListener("click", function () {
  clienteInput.value = "";
  telefonoClienteInput.value = "";
  servicioInput.value = "";
  fechaInput.value = fechaLocalISO();
  metodoPagoInput.value = "Efectivo";
  observacionesInput.value = "";
  montoInput.value = "";
  actualizarVista();
  clienteInput.focus();
});

fechaInput.value = fechaLocalISO();
actualizarVista();
