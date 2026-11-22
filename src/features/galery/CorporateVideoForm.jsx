import React, { useState, useRef } from "react";
import {
  Building,
  Video,
  Link as LinkIcon,
  User,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { subirVideoEvento } from "../../services/galeriaService";

const CorporateVideoForm = ({ onSuccess, onCancel }) => {
  const [videoData, setVideoData] = useState({
    empresa: "",
    titulo: "",
    descripcion: "",
    clienteNombre: "",
    clienteCargo: "",
    clienteComentario: "",
    videoUrl: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Manejo de avatar del cliente
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("El avatar debe ser una imagen (JPG, PNG, WEBP)");
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Manejador de campos de texto
  const handleVideoInputChange = (e) => {
    const { name, value } = e.target;
    setVideoData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Subir el caso corporativo al backend
  const handleSaveUpload = async () => {
    if (!videoData.empresa.trim()) {
      toast.error("Ingresa el nombre de la empresa (Ej: SEGUTEK)");
      return;
    }
    if (!videoData.titulo.trim()) {
      toast.error("Ingresa el nombre del evento");
      return;
    }

    setIsUploading(true);

    try {
      const res = await subirVideoEvento({
        empresa: videoData.empresa,
        titulo: videoData.titulo,
        descripcion: videoData.descripcion,
        clienteNombre: videoData.clienteNombre,
        clienteCargo: videoData.clienteCargo,
        clienteComentario: videoData.clienteComentario,
        videoUrl: videoData.videoUrl,
        avatarFile: avatarFile,
      });

      const newVideoItem = {
        id: res.id,
        category: res.categoria,
        imageUrl: res.imageUrl,
        createdAt: res.fechaCreacion,
        empresa: res.empresa,
        titulo: res.titulo,
        descripcion: res.descripcion,
        clienteNombre: res.clienteNombre,
        clienteCargo: res.clienteCargo,
        clienteComentario: res.clienteComentario,
        videoUrl: res.videoUrl,
        clienteAvatarUrl: res.clienteAvatarUrl,
      };

      toast.success("¡Caso corporativo y video subido con éxito a la web!");
      if (onSuccess) onSuccess(newVideoItem);
    } catch (error) {
      console.error("Error al subir video corporativo:", error);
      toast.error(error.response?.data?.error || "Error al procesar la subida");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="wp-video-cms-container">
      <div className="wp-video-cms-grid">
        {/* 1. Datos del Evento Corporativo */}
        <div className="wp-card-section">
          <h4 className="wp-section-subtitle">
            <Building size={16} /> 1. Datos del Evento y Empresa
          </h4>

          <div className="wp-form-group">
            <label>
              1. Nombre de la empresa <span className="req">*</span>:
            </label>
            <input
              type="text"
              name="empresa"
              value={videoData.empresa}
              onChange={handleVideoInputChange}
              placeholder="Ej: SEGUTEK"
              className="wp-input"
              autoComplete="off"
            />
          </div>

          <div className="wp-form-group">
            <label>
              2. Nombre del evento <span className="req">*</span>:
            </label>
            <input
              type="text"
              name="titulo"
              value={videoData.titulo}
              onChange={handleVideoInputChange}
              placeholder="Ej: Día Mundial de la RCP (16 de octubre)"
              className="wp-input"
              autoComplete="off"
            />
          </div>

          <div className="wp-form-group">
            <label>3. Descripción pequeña</label>
            <input
              type="text"
              name="descripcion"
              value={videoData.descripcion}
              onChange={handleVideoInputChange}
              placeholder="Ej: - TECHINVEST SAC "
              className="wp-input"
              autoComplete="off"
            />
          </div>
        </div>

        {/* 2. Reel de Demostración */}
        <div className="wp-card-section">
          <h4 className="wp-section-subtitle">
            <Video size={16} /> 2. Reel de Demostración
          </h4>

          <div className="wp-form-group">
            <label>
              <LinkIcon size={14} /> Link del reel del video (URL):
            </label>
            <input
              type="url"
              name="videoUrl"
              value={videoData.videoUrl}
              onChange={handleVideoInputChange}
              placeholder="https://instagram.com/reel/... o YouTube / Vimeo / Drive"
              className="wp-input"
              autoComplete="off"
            />
            <small className="wp-help-text">
              Enlace donde el cliente o visitante podrá ver el video completo.
            </small>
          </div>
        </div>

        {/* 3. Datos del Cliente y Testimonio */}
        <div className="wp-card-section wp-card-span-2">
          <h4 className="wp-section-subtitle">
            <User size={16} /> 3. Ficha del Cliente y Comentario
          </h4>

          <div className="wp-client-form-layout">
            {/* Subida del Avatar */}
            <div className="wp-avatar-upload-col">
              <label>Foto del cliente:</label>
              <div
                className="wp-avatar-picker"
                onClick={() => avatarInputRef.current?.click()}
                title="Clic para seleccionar foto del cliente"
              >
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  style={{ display: "none" }}
                />
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar Cliente"
                    className="wp-avatar-preview-circle"
                  />
                ) : (
                  <div className="wp-avatar-empty-circle">
                    <User size={30} />
                    <span>Subir foto</span>
                  </div>
                )}
              </div>
            </div>

            {/* Inputs de Cliente */}
            <div className="wp-client-fields-col">
              <div className="wp-form-row">
                <div className="wp-form-group flex-1">
                  <label>4. Nombre del cliente:</label>
                  <input
                    type="text"
                    name="clienteNombre"
                    value={videoData.clienteNombre}
                    onChange={handleVideoInputChange}
                    placeholder="Ej: Franko Seremet"
                    className="wp-input"
                    autoComplete="off"
                  />
                </div>

                <div className="wp-form-group flex-1">
                  <label>5. Cargo del cliente:</label>
                  <input
                    type="text"
                    name="clienteCargo"
                    value={videoData.clienteCargo}
                    onChange={handleVideoInputChange}
                    placeholder="Ej: General Manager, Cardiosafe/Techinvest"
                    className="wp-input"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="wp-form-group">
                <label>
                  <MessageSquare size={14} /> 6. Comentario corto que dejará el
                  cliente:
                </label>
                <textarea
                  name="clienteComentario"
                  value={videoData.clienteComentario}
                  onChange={handleVideoInputChange}
                  rows={3}
                  placeholder="Ej: Comentario que dirá nuestro cliente sobre la experiencia de trabajo con JudeFilms..."
                  className="wp-textarea"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones de Guardar Caso Corporativo */}
      <div className="wp-upload-actions justify-end mt-4">
        <button
          type="button"
          className="wp-btn-cancel"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="wp-btn-confirm wp-btn-confirm-video"
          onClick={handleSaveUpload}
          disabled={isUploading || !videoData.titulo || !videoData.empresa}
        >
          <span>
            {isUploading
              ? "Subiendo y Publicando..."
              : "Publicar Caso de Video Corporativo"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default CorporateVideoForm;
