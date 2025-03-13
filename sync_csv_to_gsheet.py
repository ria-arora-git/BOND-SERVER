import gspread
import pandas as pd
import time
from oauth2client.service_account import ServiceAccountCredentials
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Google Sheets API Setup
SCOPE = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
CREDS_FILE = "credentials.json"  # Ensure this file is in your project directory

credentials = ServiceAccountCredentials.from_json_keyfile_name(CREDS_FILE, SCOPE)
client = gspread.authorize(credentials)

# Google Sheet Details
SHEET_NAME = "Your Google Sheet Name"
WORKSHEET_NAME = "Sheet1"  # Change accordingly
sheet = client.open(SHEET_NAME).worksheet(WORKSHEET_NAME)

CSV_FILE = "your_file.csv"

def update_google_sheet():
    """Updates Google Sheet with the latest CSV data."""
    df = pd.read_csv(CSV_FILE)
    sheet.clear()  # Clear existing data
    sheet.update([df.columns.values.tolist()] + df.values.tolist())
    print("Google Sheet updated!")

# Monitor CSV for changes
class CSVHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith(CSV_FILE):
            print("CSV file changed, updating Google Sheet...")
            update_google_sheet()

# Start file watcher
observer = Observer()
observer.schedule(CSVHandler(), path=".", recursive=False)
observer.start()

print("Watching for CSV changes...")
try:
    while True:
        time.sleep(5)
except KeyboardInterrupt:
    observer.stop()
observer.join()
