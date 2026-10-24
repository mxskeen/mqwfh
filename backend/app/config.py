from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    elexon_base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"
    db_path: str = str(BASE_DIR / "data" / "elexon_wind.db")
    default_decision_time_utc: str = "11:00:00"

    model_config = SettingsConfigDict(
        env_file=(".env", str(BASE_DIR.parent / ".env")),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def fuelhh_stream_url(self) -> str:
        return f"{self.elexon_base_url.rstrip('/')}/datasets/FUELHH/stream"

    @property
    def windfor_stream_url(self) -> str:
        return f"{self.elexon_base_url.rstrip('/')}/datasets/WINDFOR/stream"

    def ensure_directories(self) -> None:
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

settings = Settings()
settings.ensure_directories()

# Module-level aliases for direct imports
DB_PATH = settings.db_path
ELEXON_BASE_URL = settings.elexon_base_url
FUELHH_STREAM_URL = settings.fuelhh_stream_url
WINDFOR_STREAM_URL = settings.windfor_stream_url
DEFAULT_DECISION_TIME_UTC = settings.default_decision_time_utc
