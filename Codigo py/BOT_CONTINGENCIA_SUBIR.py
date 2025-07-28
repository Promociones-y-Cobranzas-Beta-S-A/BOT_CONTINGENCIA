from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import pickle
import os

SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_credentials():
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'Codigo py\\client_secret_388560142719-tgcnj5gnu14kt21gvfps88qu9til4l0s.apps.googleusercontent.com.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    return creds

def subir_archivo_a_unidad_compartida(nombre_archivo_local, nombre_archivo_drive, carpeta_id, shared_drive_id):
    creds = get_credentials()
    service = build('drive', 'v3', credentials=creds)

    file_metadata = {
        'name': nombre_archivo_drive,
        'parents': [carpeta_id]
    }
    media = MediaFileUpload(nombre_archivo_local, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id',
        supportsAllDrives=True
    ).execute()
    print('ID de archivo subido:', file.get('id'))

def sobrescribir_archivo_en_drive(nombre_archivo_local, archivo_id):
    creds = get_credentials()
    service = build('drive', 'v3', credentials=creds)

    media = MediaFileUpload(nombre_archivo_local, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    file = service.files().update(
        fileId=archivo_id,
        media_body=media,
        supportsAllDrives=True
    ).execute()
    print('Archivo sobrescrito. ID:', file.get('id'))



if __name__ == '__main__':
    # Cambia estos valores:
    #nombre_archivo_local = 'GANTT TRANSFORMACIÓN.xlsx'  # Archivo local a subir
    nombre_archivo_drive = 'Muestra para Bot Contingencia.csv'  # Nombre que tendrá en Drive
    shared_drive_id = '0AN-_u73BpXB9Uk9PVA'      # ID de la unidad compartida
    carpeta_id = '1uiVUixE2nIWhM_lx0YwpAsKd3stLUve8' # ID de la carpeta dentro de la unidad compartida

    # Cambia estos valores:
    nombre_archivo_local = 'Muestra para Bot Contingencia.csv'  # Archivo local a subir
    archivo_id = '1rqcGlQyKsDFkmGvniP22222mLJk90Czx'    # ID del archivo a sobrescribir

    sobrescribir_archivo_en_drive(nombre_archivo_local, archivo_id)


    #subir_archivo_a_unidad_compartida(nombre_archivo_local, nombre_archivo_drive, carpeta_id, shared_drive_id)