import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Upload,
  Trash2,
  X,
  Plus,
  Image as ImageIcon,
  Check,
  Video,
  Play,
  Link as LinkIcon,
} from "lucide-react";
import ConfirmModal from "../../components/UI/ConfirmModal";
import toast from "react-hot-toast";
import "./GaleryWebAdmin.css";
import CorporateVideoForm from "./CorporateVideoForm";
import { getVideoEmbedUrl } from "../../utils/videoUtils";
import {
  getGaleriaFotos,
  subirFoto,
  eliminarFoto,
} from "../../services/galeriaService";

const CATEGORIAS = [
  { id: "todos", label: "Todas" },
  { id: "bodas", label: "Bodas" },
  { id: "eventos", label: "Eventos" },
  { id: "corporativo", label: "Corporativo" },
  { id: "sesiones", label: "Sesiones" },
  { id: "videos", label: "Videos" },
];

const GaleryWebAdmin = () => {
  const [photos, setPhotos] = useState([]);
  const [filterCategory, setFilterCategory] = useState("todos");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("bodas");

  // Estado para subida de fotos normales
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const fileInputRef = useRef(null);

  const [selectedImageDetail, setSelectedImageDetail] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Cargar Datos del Backend
  const cargarFotos = async () => {
    setIsLoading(true);
    try {
      const data = await getGaleriaFotos();

      const fotosAdaptadas = data.map((item) => ({
        id: item.id,
        category: item.categoria,
        imageUrl: item.imageUrl,
        createdAt: item.fechaCreacion,
        empresa: item.empresa || "",
        titulo: item.titulo || "",
        descripcion: item.descripcion || "",
        clienteNombre: item.clienteNombre || "",
        clienteCargo: item.clienteCargo || "",
        clienteComentario: item.clienteComentario || "",
        videoUrl: item.videoUrl || "",
        clienteAvatarUrl: item.clienteAvatarUrl || "",
      }));
      setPhotos(fotosAdaptadas);
    } catch (error) {
      console.error("Error al cargar galería:", error);
      toast.error("No se pudieron cargar los elementos del servidor");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarFotos();
  }, []);

  const filteredPhotos = useMemo(() => {
    if (filterCategory === "todos") return photos;
    return photos.filter((p) => p.category === filterCategory);
  }, [photos, filterCategory]);

  // Manejo de imagen tradicional de galería
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida (JPG, PNG, WEBP)");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Subir la imagen tradicional a la web
  const handleSaveUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecciona una imagen primero");
      return;
    }

    setIsUploading(true);

    try {
      const res = await subirFoto(selectedFile, uploadCategory);

      const newPhoto = {
        id: res.id,
        category: res.categoria,
        imageUrl: res.imageUrl,
        createdAt: res.fechaCreacion,
      };

      setPhotos((prev) => [newPhoto, ...prev]);
      toast.success("Imagen subida con éxito");

      setPreviewImage("");
      setSelectedFile(null);
      setIsUploadOpen(false);
    } catch (error) {
      console.error("Error al subir foto:", error);
      toast.error(error.response?.data?.error || "Error al procesar la subida");
    } finally {
      setIsUploading(false);
    }
  };

  // Solicitar eliminación cerrando el modal de detalle para mostrar ConfirmModal
  const handleDeleteRequest = (item) => {
    setPhotoToDelete(item);
    setSelectedImageDetail(null);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;
    try {
      await eliminarFoto(photoToDelete.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photoToDelete.id));
      if (selectedImageDetail?.id === photoToDelete.id) {
        setSelectedImageDetail(null);
      }
      toast.success("Elemento eliminado de la web y de Cloudflare R2");
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar el elemento");
    } finally {
      setPhotoToDelete(null);
    }
  };

  // Abrir panel asegurando categoría acorde al filtro activo
  const handleOpenUploadPanel = () => {
    if (!isUploadOpen) {
      if (filterCategory === "videos") {
        setUploadCategory("videos");
      } else if (filterCategory !== "todos") {
        setUploadCategory(filterCategory);
      } else {
        setUploadCategory("bodas");
      }
    }
    setIsUploadOpen(!isUploadOpen);
  };

  return (
    <div className="wp-media-page">
      {/* ── Cabecera Simple Estilo WordPress ── */}
      <div className="wp-media-header">
        <div className="wp-media-title-wrap">
          <h2>Gestor de Galería</h2>
          <span className="wp-media-count">
            {photos.length}{" "}
            {photos.length === 1 ? "elemento en web" : "elementos en web"}
          </span>
        </div>

        <button
          type="button"
          className="wp-btn-add-new"
          onClick={handleOpenUploadPanel}
        >
          {isUploadOpen ? <X size={16} /> : <Plus size={16} />}
          <span>
            {isUploadOpen
              ? "Cerrar"
              : filterCategory === "videos"
                ? "Añadir Nuevo Video Corporativo"
                : "Añadir nuevo"}
          </span>
        </button>
      </div>

      {/* ── Zona de Carga Directa (Desplegable) ── */}
      {isUploadOpen && (
        <div className="wp-upload-panel">
          {/* Selector de Categoría al inicio para alternar el formulario */}
          <div className="wp-category-top-selector">
            <span className="wp-section-badge">
              {uploadCategory === "videos" ? (
                <>
                  <Video size={16} /> Llene los datos para subir el video
                </>
              ) : (
                <>
                  <ImageIcon size={16} /> Subida de Fotografía Estándar
                </>
              )}
            </span>

            <div className="wp-category-select-wrap">
              <label>Categoría destino:</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="wp-select wp-select-highlight"
              >
                <option value="bodas">Bodas</option>
                <option value="eventos">Eventos</option>
                <option value="corporativo">Corporativo (Fotos)</option>
                <option value="sesiones">Sesiones</option>
                <option value="videos">Videos (Eventos Corporativos)</option>
              </select>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* CASO A: SI LA CATEGORÍA ES 'VIDEOS' (FORMULARIO CORPORATIVO) */}
          {/* ──────────────────────────────────────────────────────────── */}
          {uploadCategory === "videos" ? (
            <CorporateVideoForm
              onSuccess={(newVideoItem) => {
                setPhotos((prev) => [newVideoItem, ...prev]);
                setIsUploadOpen(false);
              }}
              onCancel={() => setIsUploadOpen(false)}
            />
          ) : (
            /* ──────────────────────────────────────────────────────────── */
            /* CASO B: SUBIDA TRADICIONAL DE FOTO A LA GALERÍA              */
            /* ──────────────────────────────────────────────────────────── */
            <>
              <div
                className={`wp-dropzone ${previewImage ? "has-preview" : ""}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />

                {previewImage ? (
                  <div className="wp-preview-box">
                    <img
                      src={previewImage}
                      alt="Vista previa"
                      className="wp-preview-img"
                    />
                    <span className="wp-change-label">
                      Clic para cambiar imagen
                    </span>
                  </div>
                ) : (
                  <div className="wp-dropzone-inner">
                    <Upload size={32} className="wp-upload-icon" />
                    <p>
                      Arrastra tu imagen aquí o{" "}
                      <strong>haz clic para seleccionar</strong>
                    </p>
                    <span>Formatos soportados: JPG, PNG, WEBP</span>
                  </div>
                )}
              </div>

              <div className="wp-upload-controls">
                <div className="wp-upload-actions ml-auto">
                  <button
                    type="button"
                    className="wp-btn-cancel"
                    onClick={() => {
                      setPreviewImage("");
                      setSelectedFile(null);
                      setIsUploadOpen(false);
                    }}
                    disabled={isUploading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="wp-btn-confirm"
                    disabled={!previewImage || isUploading}
                    onClick={handleSaveUpload}
                  >
                    <Check size={16} />
                    <span>
                      {isUploading ? "Subiendo..." : "Subir a la Web"}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Filtro por Categorías ── */}
      <div className="wp-filter-bar">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`wp-filter-btn ${
              filterCategory === cat.id ? "active" : ""
            } ${cat.id === "videos" ? "wp-btn-filter-video" : ""}`}
            onClick={() => setFilterCategory(cat.id)}
          >
            {cat.id === "videos"}
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Grid de Medios Tipo WordPress ── */}
      {filteredPhotos.length === 0 ? (
        <div className="wp-empty-gallery">
          {filterCategory === "videos" ? (
            <Video size={44} className="text-muted" />
          ) : (
            <ImageIcon size={40} className="text-muted" />
          )}
          <p>
            {filterCategory === "videos"
              ? "No hay casos de videos corporativos registrados todavía."
              : "No hay imágenes en esta categoría."}
          </p>
          <button
            type="button"
            className="wp-btn-upload-empty"
            onClick={() => {
              setUploadCategory(
                filterCategory === "todos" ? "bodas" : filterCategory,
              );
              setIsUploadOpen(true);
            }}
          >
            {filterCategory === "videos"
              ? "Subir primer caso corporativo aquí"
              : "Subir una imagen aquí"}
          </button>
        </div>
      ) : (
        <div className="wp-media-grid">
          {filteredPhotos.map((photo) => {
            const isVideo = photo.category === "videos";

            return (
              <div
                key={photo.id}
                className={`wp-media-item ${
                  selectedImageDetail?.id === photo.id ? "is-selected" : ""
                } ${isVideo ? "is-video-item" : ""}`}
                onClick={() => setSelectedImageDetail(photo)}
              >
                {/* Imagen de miniatura */}
                <div className="wp-media-thumb-wrap">
                  <img
                    src={
                      photo.imageUrl ||
                      photo.clienteAvatarUrl ||
                      "/client-avatar.jpg"
                    }
                    alt={photo.titulo || photo.category}
                    className="wp-media-thumb"
                    loading="lazy"
                  />

                  {/* Si es video, overlay con botón de Play */}
                  {isVideo && (
                    <div className="wp-video-grid-overlay">
                      <div className="wp-video-grid-play">
                        <Play size={18} fill="#ffffff" />
                      </div>
                      <span className="wp-video-grid-badge">Reel</span>
                    </div>
                  )}
                </div>

                {/* Badge de categoría */}
                <span
                  className={`wp-item-badge ${isVideo ? "wp-badge-video" : ""}`}
                >
                  {isVideo ? "VIDEO CORPORATIVO" : photo.category}
                </span>

                {/* Info adicional para videos en la tarjeta */}
                {isVideo && (
                  <div className="wp-item-video-meta">
                    {photo.empresa && (
                      <span className="wp-meta-company">{photo.empresa}</span>
                    )}
                    <h5 className="wp-meta-title">
                      {photo.titulo || "Caso Corporativo"}
                    </h5>
                    {photo.clienteNombre && (
                      <span className="wp-meta-client">
                        👤 {photo.clienteNombre}
                      </span>
                    )}
                  </div>
                )}

                {/* Botón de eliminar en hover */}
                <button
                  type="button"
                  className="wp-item-delete-btn"
                  title="Eliminar elemento"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoToDelete(photo);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal de Vista Previa al Hacer Clic en un Elemento ── */}
      {selectedImageDetail && (
        <div
          className="wp-modal-overlay"
          onClick={() => setSelectedImageDetail(null)}
        >
          <div
            className={`wp-modal-detail ${
              selectedImageDetail.category === "videos"
                ? "wp-modal-detail-video"
                : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="wp-modal-close"
              onClick={() => setSelectedImageDetail(null)}
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>

            {/* CASO VIDEO CORPORATIVO */}
            {selectedImageDetail.category === "videos" ? (
              <div className="wp-modal-video-showcase">
                <div className="wp-modal-video-left">
                  <div className="wp-modal-video-player-wrap">
                    {selectedImageDetail.videoUrl ? (
                      <iframe
                        src={getVideoEmbedUrl(selectedImageDetail.videoUrl)}
                        title={selectedImageDetail.titulo || "Video corporativo"}
                        className="wp-modal-video-iframe"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        <img
                          src={
                            selectedImageDetail.imageUrl ||
                            selectedImageDetail.clienteAvatarUrl ||
                            "/client-avatar.jpg"
                          }
                          alt={selectedImageDetail.titulo}
                          className="wp-modal-video-bg"
                        />
                        <div className="wp-modal-video-center-btn">
                          <Play size={28} fill="#ffffff" />
                        </div>
                      </>
                    )}
                    {selectedImageDetail.videoUrl && (
                      <a
                        href={selectedImageDetail.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wp-modal-video-link-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LinkIcon size={14} /> Abrir link en pestaña nueva
                      </a>
                    )}
                  </div>
                </div>

                <div className="wp-modal-video-right">
                  {selectedImageDetail.empresa && (
                    <div className="wp-modal-empresa-pill">
                      {selectedImageDetail.empresa}
                    </div>
                  )}

                  <span className="wp-modal-eyebrow">EVENTO CORPORATIVO</span>
                  <h3 className="wp-modal-event-title">
                    {selectedImageDetail.titulo || "Evento Corporativo"}
                  </h3>

                  {selectedImageDetail.descripcion && (
                    <p className="wp-modal-event-desc">
                      {selectedImageDetail.descripcion}
                    </p>
                  )}

                  {/* Ficha Testimonial */}
                  <div className="wp-modal-testimonial-card">
                    <div className="wp-modal-test-author">
                      <div className="wp-modal-avatar-frame">
                        <img
                          src={
                            selectedImageDetail.clienteAvatarUrl ||
                            selectedImageDetail.imageUrl ||
                            "/client-avatar.jpg"
                          }
                          alt={selectedImageDetail.clienteNombre}
                          className="wp-modal-avatar-img"
                        />
                      </div>
                      <div>
                        <h4 className="wp-modal-author-name">
                          {selectedImageDetail.clienteNombre || "Cliente"}
                        </h4>
                        <p className="wp-modal-author-role">
                          {selectedImageDetail.clienteCargo || "Representante"}
                        </p>
                      </div>
                    </div>

                    {selectedImageDetail.clienteComentario && (
                      <blockquote className="wp-modal-quote">
                        “{selectedImageDetail.clienteComentario}”
                      </blockquote>
                    )}
                  </div>

                  <div className="wp-modal-actions-bar mt-auto">
                    <button
                      type="button"
                      className="wp-btn-delete-full"
                      onClick={() => handleDeleteRequest(selectedImageDetail)}
                    >
                      <Trash2 size={16} />
                      <span>Eliminar caso corporativo permanentemente</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* CASO FOTOGRAFÍA ESTÁNDAR */
              <>
                <div className="wp-modal-image-wrap">
                  <img
                    src={selectedImageDetail.imageUrl}
                    alt={selectedImageDetail.category}
                  />
                </div>

                <div className="wp-modal-sidebar-info">
                  <h4>Detalles de la imagen</h4>
                  <div className="wp-info-row">
                    <span>Categoría:</span>
                    <strong>
                      {selectedImageDetail.category.toUpperCase()}
                    </strong>
                  </div>
                  <div className="wp-info-row">
                    <span>Fecha:</span>
                    <span>{selectedImageDetail.createdAt}</span>
                  </div>

                  <div className="wp-modal-actions-bar">
                    <button
                      type="button"
                      className="wp-btn-delete-full"
                      onClick={() => handleDeleteRequest(selectedImageDetail)}
                    >
                      <Trash2 size={16} />
                      <span>Eliminar permanentemente</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal de Confirmación ── */}
      <ConfirmModal
        isOpen={!!photoToDelete}
        onClose={() => setPhotoToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar este elemento?"
        message="Se eliminará de la base de datos y de tu almacenamiento Cloudflare R2, dejando de mostrarse en la web."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default GaleryWebAdmin;
