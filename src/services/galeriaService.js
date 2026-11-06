import api from './api'

export const getGaleriaFotos= async()=>{
    const {data}=await api.get('/public/galeria')
    return data;
};

export const subirFoto=async(file,categoria)=>{
    const formData=new FormData();
    formData.append('file',file)
    formData.append('categoria',categoria)

    const {data}=await api.post('/galeria',formData,{
        headers:{
            'Content-Type':'multipart/form-data',
        },
    });
    return data;
}

export const eliminarFoto=async(id)=>{
    const{data}=await api.delete(`/galeria/${id}`);
    return data;
}