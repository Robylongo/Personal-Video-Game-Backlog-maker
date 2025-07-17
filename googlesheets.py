import gspread
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import random

SERVICE_ACCOUNT_FILE = 'Video games service account.json'

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

SHEET_NAME = 'Backlog'

FOLDER_NAME = 'GameBacklogSheets'

def authenticate_google_apis():
    creds = Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=SCOPES
    )
    gc = gspread.authorize(creds)
    drive_service = build('drive', 'v3', credentials=creds)

    return gc, drive_service


def get_folder_id(drive_service, folder_name):
    try:
        results = drive_service.files().list(
            q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'",
            spaces='drive',
            fields='files(id, name)',
            pageSize=10
        ).execute()
        items = results.get('files', [])

        if not items:
            print(f"No folder named '{folder_name}' found.")
            return None
        else:
            folder_id = items[0]['id']
            return folder_id
    except HttpError as error:
        print(f"An error occurred: {error}")
        return None


def sheet_exists(drive_service, sheet_name, folder_id):
    try:
        query = f"name='{sheet_name}' and mimeType='application/vnd.google-apps.spreadsheet' and '{folder_id}' in parents"
        results = drive_service.files().list(
            q=query,
            spaces='drive',
            fields='files(id, name)',
            pageSize=10
        ).execute()
        items = results.get('files', [])

        if not items:
            return False, None
        else:
            return True, items[0]['id']
    except HttpError as error:
        print(f"An error occurred: {error}")
        return False, None


def create_sheet(gc, drive_service, sheet_name, folder_id):
    try:
        # Create a new Google Sheet
        sh = gc.create(sheet_name)

        # The newly created sheet is in the root folder; get its file ID
        file_id = sh.id

        # Retrieve current parents of the file
        file = drive_service.files().get(fileId=file_id, fields='parents').execute()
        current_parents = file.get('parents', [])

        # Move the file to the desired folder
        drive_service.files().update(
            fileId=file_id,
            addParents=folder_id,
            removeParents=','.join(current_parents),
            fields='id, parents'
        ).execute()

        return sh
    except HttpError as error:
        print(f"An error occurred: {error}")
        return None

def get_or_create_sheet(gc, drive_service, sheet_name, folder_id):
    exists, sheet_id = sheet_exists(drive_service, sheet_name, folder_id)
    if exists:
        sh = gc.open_by_key(sheet_id)
    else:
        sh = create_sheet(gc, drive_service, sheet_name, folder_id)
    return sh

def is_sheet_empty(values):
    for row in values:
        for cell in row:
            if cell.strip() != '':
                return False
    return True


def sheet_initializer(game_details):
    gc, drive_service = authenticate_google_apis()

    folder_id = get_folder_id(drive_service, FOLDER_NAME)
    if not folder_id:
        print("Exiting program due to missing folder.")
        return -1

    sheet = get_or_create_sheet(gc, drive_service, SHEET_NAME, folder_id)
    if not sheet:
        print("Failed to access or create the sheet.")
        return -1

    worksheet = sheet.sheet1
    existing_values = worksheet.get_all_values()

    # Check if the sheet is empty and add headers if necessary
    if is_sheet_empty(existing_values):
        headers = ['Name', 'Playtime', 'Genre', 'Platforms', 'Rating']
        worksheet.append_row(headers)

    try:
        # Extract the game name from game_details
        game_name = game_details.get('name', '')
        if not game_name:
            print("Game name is missing. Cannot add to the sheet.")
            return -1

        # Check if the game already exists
        if not game_already_exists(worksheet, game_name):
            # Prepare the row data based on headers
            row_data = [
                game_details.get('name', ''),
                game_details.get('playtime', ''),
                game_details.get('genre', ''),
                game_details.get('platform', ''),
                game_details.get('rating', '')
            ]

            # Append the row data to the sheet
            worksheet.append_row(row_data)
        else:
            print(f"Game '{game_name}' already exists in the sheet.")
            return -1
    except Exception as e:
        print(f"An error occurred while adding the game: {e}")
        return -1


def game_already_exists(worksheet, game_name):
    """
    Checks if a game already exists in the 'Name' column of the sheet.

    Parameters:
    - worksheet: The gspread Worksheet object.
    - game_name: The name of the game to check.

    Returns:
    - True if the game exists, False otherwise.
    """
    try:
        # Assuming 'Name' is in the first column (A)
        name_column = worksheet.col_values(1)  # Get all values in column A
        # Exclude the header row
        for existing_game in name_column[1:]:
            if existing_game.strip().lower() == game_name.strip().lower():
                return True
        return False
    except Exception as e:
        return False

def random_game():
    gc, drive_service = authenticate_google_apis()
    folder_id = get_folder_id(drive_service, FOLDER_NAME)
    sheet = get_or_create_sheet(gc, drive_service, SHEET_NAME, folder_id)
    worksheet = sheet.sheet1
    games = []
    for game in worksheet.col_values(1)[1:]:
        games.append(game)
    return random.choice(games)

#print(random_game())






