import api from './api'

export const getGaleriaFotos= async()=>{
    const {data}=await api.get('/public/galeria')
    return data;
};

export const subirFoto = async (file, categoria) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoria', categoria);

    const { data } = await api.post('/galeria', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

// Subir caso de éxito / Video corporativo para el CMS
export const subirVideoEvento = async (datos) => {
    const formData = new FormData();
    formData.append('categoria', 'videos');
    formData.append('empresa', datos.empresa || '');
    formData.append('titulo', datos.titulo || '');
    formData.append('descripcion', datos.descripcion || '');
    formData.append('clienteNombre', datos.clienteNombre || '');
    formData.append('clienteCargo', datos.clienteCargo || '');
    formData.append('clienteComentario', datos.clienteComentario || '');
    formData.append('videoUrl', datos.videoUrl || '');

    if (datos.avatarFile) {
        formData.append('avatarFile', datos.avatarFile);
    }

    const { data } = await api.post('/galeria', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

export const eliminarFoto=async(id)=>{
    const{data}=await api.delete(`/galeria/${id}`);
    return data;
}