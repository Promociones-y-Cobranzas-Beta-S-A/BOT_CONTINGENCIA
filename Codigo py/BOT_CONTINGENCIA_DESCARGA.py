from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.errors import HttpError
import pickle
import os
import io

SCOPES = ['https://www.googleapis.com/auth/drive']

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
                'client_secret_388560142719-tgcnj5gnu14kt21gvfps88qu9til4l0s.apps.googleusercontent.com.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    return creds

def download_any_file(file_id, destination=None):
    creds = get_credentials()
    service = build('drive', 'v3', credentials=creds)
    try:
        file = service.files().get(fileId=file_id, fields='mimeType, name', supportsAllDrives=True).execute()
        mimeType = file.get('mimeType')
        name = file.get('name')
        print(f"Tipo de archivo: {mimeType}")

        # Si no se da destino, se usa el nombre original
        if destination is None:
            destination = name
        elif os.path.isdir(destination):
            destination = os.path.join(destination, name)

        if mimeType == 'application/vnd.google-apps.spreadsheet':
            # Google Sheets → exportar como Excel
            request = service.files().export_media(
                fileId=file_id,
                mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                supportsAllDrives=True
            )
            if not destination.endswith('.xlsx'):
                destination += '.xlsx'
        else:
            request = service.files().get_media(fileId=file_id, supportsAllDrives=True)

        fh = io.FileIO(destination, 'wb')
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
            print(f"Descargando... {int(status.progress() * 100)}%")
        print(f"✅ Archivo descargado como: {destination}")

    except HttpError as error:
        if error.resp.status == 404:
            print(f"❌ Error 404: Archivo no encontrado. Verifica que el ID '{file_id}' es correcto y tienes acceso.")
        else:
            print(f"❌ Error HTTP: {error}")

if __name__ == '__main__':
    shared_drive_id = "0AN-_u73BpXB9Uk9PVA"  # ID de la unidad compartida
    carpeta_id = "1uiVUixE2nIWhM_lx0YwpAsKd3stLUve8"           # Cambia por el ID real de la carpeta
    archivo_id = "1XLApkX7orYBMbYERS89oR_6K5KDkwgUf"           # Cambia por el ID real del archivo
    destino = "C:\\Users\\crgonzalez\\Documents\\Bot Contingencia"

    # Si quieres descargar el archivo directamente por su ID:
    download_any_file(archivo_id, destino)