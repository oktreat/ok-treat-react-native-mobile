import api from '../config/api';
export async function palsRequest(path, body) {
  try { const response = await api.request({url:'/pals/'+path,method:body===undefined?'GET':'POST',data:body,timeout:25000});return response.data.data; }
  catch(error) {const failure=new Error(error.response?.data?.message||'PALS could not connect. Please try again.');failure.status=error.response?.status;throw failure;}
}
