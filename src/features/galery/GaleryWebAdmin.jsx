import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Upload,
  Trash2,
  X,
  Plus,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import ConfirmModal from "../../components/UI/ConfirmModal";
import toast from "react-hot-toast";
import "./GaleryWebAdmin.css";
import {
  getGaleriaFotos,
  subirFoto,
  eliminarFoto,
} from "../../services/galeriaService";
import { tr } from "date-fns/locale";

const CATEGORIAS = [
  { id: "todos", label: "Todas" },
  { id: "bodas", label: "Bodas" },
  { id: "eventos", label: "Eventos" },
  { id: "corporativo", label: "Corporativo" },
  { id: "sesiones", label: "Sesiones" },
  { id: "videos", label: "Videos" },
];

const INITIAL_PHOTOS = [
  {
    id: 1,
    category: "bodas",
    imageUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-02-15",
  },
  {
    id: 2,
    category: "bodas",
    imageUrl:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-02-18",
  },
  {
    id: 3,
    category: "corporativo",
    imageUrl:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-02-25",
  },
  {
    id: 4,
    category: "eventos",
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-03-01",
  },
  {
    id: 5,
    category: "sesiones",
    imageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-03-05",
  },
  {
    id: 6,
    category: "videos",
    imageUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-03-10",
  },
];

const STORAGE_KEY = "judefilms_galery_web_photos";

const GaleryWebAdmin = () => {
  const [photos, setPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
    } catch {
      return INITIAL_PHOTOS;
    }
  });

  const [filterCategory, setFilterCategory] = useState("todos");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("bodas");
  const [previewImage, setPreviewImage] = useState("");
  const [selectedImageDetail, setSelectedImageDetail] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Cargar Datos del Backend
  useEffect(() => {
    const cargarFotos = async () => {
      setIsLoading(true);
      try {
        const data = await getGaleriaFotos();

        const fotosAdaptadas = data.map((item) => ({
          id: item.id,
          category: item.categoria,
          imageUrl: item.imageUrl,
          createdAt: item.fechaCreacion,
        }));
        setPhotos(fotosAdaptadas);
      } catch (error) {
        console.log("Error al cargar fotos:", error);
        toast.error("No se pudieron cargar las fotos del servidor");
      } finally {
        setIsLoading(false);
      }
    };
    cargarFotos();
  }, []);



  const filteredPhotos = useMemo(() => {
    if (filterCategory === "todos") return photos;
    return photos.filter((p) => p.category === filterCategory);
  }, [photos, filterCategory]);

  // Manejar archivo seleccionado
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen valida (JPG, PNG, WEBP)")
      return;
    }

    setSelectedFile(file);


    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Subir la imagen a la galería
  const handleSaveUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecciona una imagen primero");
      return;
    }
    setIsUploading(true);
    try{
      const res=await subirFoto(selectedFile,uploadCategory)
    

    const newPhoto = {
      id: res.id,
      category: res.categoria,
      imageUrl: res.imageUrl,
      createdAt: res.fechaCreacion
    }
    
    setPhotos((prev) => [newPhoto, ...prev]);
    toast.success("Imagen subida con éxito");

    setPreviewImage("");
    setSelectedFile(null);
    setIsUploadOpen(false);
  } catch(error){
    console.error("Error al subir",error);
    toast.error(error.response?.data?.error || 'Error al subir la imagen');

  } finally{
    setIsUploading(false)
  }
  }

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
  if (!photoToDelete) return;
  try {
    await eliminarFoto(photoToDelete.id);
    setPhotos(prev => prev.filter(p => p.id !== photoToDelete.id));
    if (selectedImageDetail?.id === photoToDelete.id) {
      setSelectedImageDetail(null);
    }
    toast.success('Imagen eliminada de la web y de R2');
  } catch (error) {
    console.error('Error al eliminar:', error);
    toast.error('Error al eliminar la imagen');
  } finally {
    setPhotoToDelete(null);
  }
};

  return (
    <div className="wp-media-page">
      {/* ── Cabecera Simple Estilo WordPress ── */}
      <div className="wp-media-header">
        <div className="wp-media-title-wrap">
          <h2>Biblioteca de Medios</h2>
          <span className="wp-media-count">{photos.length} imágenes</span>
        </div>

        <button
          type="button"
          className="wp-btn-add-new"
          onClick={() => setIsUploadOpen(!isUploadOpen)}
        >
          {isUploadOpen ? <X size={16} /> : <Plus size={16} />}
          <span>{isUploadOpen ? "Cerrar" : "Añadir nueva"}</span>
        </button>
      </div>

      {/* ── Zona de Carga Directa (Desplegable) ── */}
      {isUploadOpen && (
        <div className="wp-upload-panel">
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
                  Click para cambiar imagen
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
            <div className="wp-category-select-wrap">
              <label>Categoría en la Web:</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="wp-select"
              >
                <option value="bodas">Bodas</option>
                <option value="eventos">Eventos</option>
                <option value="corporativo">Corporativo</option>
                <option value="sesiones">Sesiones</option>
                <option value="videos">Videos</option>
              </select>
            </div>

            <div className="wp-upload-actions">
              <button
                type="button"
                className="wp-btn-cancel"
                onClick={() => {
                  setPreviewImage("");
                  setIsUploadOpen(false);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="wp-btn-confirm"
                disabled={!previewImage}
                onClick={handleSaveUpload}
              >
                <Check size={16} />
                <span>Subir a la Web</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filtro por Categorías ── */}
      <div className="wp-filter-bar">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`wp-filter-btn ${filterCategory === cat.id ? "active" : ""}`}
            onClick={() => setFilterCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Grid de Medios Tipo WordPress ── */}
      {filteredPhotos.length === 0 ? (
        <div className="wp-empty-gallery">
          <ImageIcon size={40} />
          <p>No hay imágenes en esta categoría.</p>
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
            Subir una imagen aquí
          </button>
        </div>
      ) : (
        <div className="wp-media-grid">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className={`wp-media-item ${selectedImageDetail?.id === photo.id ? "is-selected" : ""}`}
              onClick={() => setSelectedImageDetail(photo)}
            >
              <img
                src={photo.imageUrl}
                alt={photo.category}
                className="wp-media-thumb"
                loading="lazy"
              />

              <span className="wp-item-badge">{photo.category}</span>

              {/* Botón de eliminar en hover */}
              <button
                type="button"
                className="wp-item-delete-btn"
                title="Eliminar imagen"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoToDelete(photo);
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal de Vista Previa Sencillo al Hacer Clic en una Foto ── */}
      {selectedImageDetail && (
        <div
          className="wp-modal-overlay"
          onClick={() => setSelectedImageDetail(null)}
        >
          <div className="wp-modal-detail" onClick={(e) => e.stopPropagation()}>
            <button
              className="wp-modal-close"
              onClick={() => setSelectedImageDetail(null)}
            >
              <X size={20} />
            </button>

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
                <strong>{selectedImageDetail.category.toUpperCase()}</strong>
              </div>
              <div className="wp-info-row">
                <span>Fecha:</span>
                <span>{selectedImageDetail.createdAt}</span>
              </div>

              <div className="wp-modal-actions-bar">
                <button
                  type="button"
                  className="wp-btn-delete-full"
                  onClick={() => setPhotoToDelete(selectedImageDetail)}
                >
                  <Trash2 size={16} />
                  <span>Eliminar permanentemente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Confirmación ── */}
      <ConfirmModal
        isOpen={!!photoToDelete}
        onClose={() => setPhotoToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar esta imagen?"
        message="Esta fotografía ya no se mostrará en la página web."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default GaleryWebAdmin;
