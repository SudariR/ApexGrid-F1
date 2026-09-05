from pydantic import BaseModel, Field


class PodiumDriver(BaseModel):
    """One driver entry, used for the winner and the podium steps."""

    position: int = Field(..., description="Final race position (1 = winner).")
    driver_code: str = Field(..., description="3-letter code, e.g. 'NOR'.")
    full_name: str = Field(..., description="Full name, e.g. 'Lando Norris'.")
    team_name: str = Field(..., description="Constructor, e.g. 'McLaren'.")
    driver_number: int | None = Field(default=None, description="Permanent driver number.")
    grid_position: int | None = Field(default=None, description="Starting position.")
    status: str | None = Field(default=None, description="e.g. 'Finished' or 'DNF'.")
    points: float | None = Field(default=None, description="Points scored.")
    finish_gap: str | None = Field(
        default=None,
        description="F1 'Time' interval as H:MM:SS.mmm. Winner: total race time. "
        "All other finishers: time behind the winner.",
    )


class HeroResponse(BaseModel):
    """Payload for the Hero / 'Podium Spotlight' section.

    Represents the most recent COMPLETED grand prix and its podium.
    """

    season: int = Field(..., description="Season year, e.g. 2026.")
    round: int = Field(..., description="Round number of the grand prix.")
    event_name: str = Field(..., description="e.g. 'Dutch Grand Prix'.")
    country: str = Field(..., description="Host country, e.g. 'Netherlands'.")
    location: str = Field(..., description="Circuit/town, e.g. 'Zandvoort'.")
    race_date: str = Field(..., description="Race date (ISO), e.g. '2026-08-23'.")
    total_laps: int | None = Field(default=None, description="Laps in the race.")
    winner: PodiumDriver = Field(..., description="The race winner.")
    podium: list[PodiumDriver] = Field(
        ..., description="Top-3 finishers (index 0 == winner)."
    )


class DriverStanding(BaseModel):
    """One row of the Drivers' Championship standings."""

    position: int = Field(..., description="Championship position (1 = leader).")
    driver_code: str = Field(..., description="3-letter code, e.g. 'NOR'.")
    full_name: str = Field(..., description="Driver full name.")
    nationality: str | None = Field(default=None, description="Driver nationality.")
    team_name: str | None = Field(default=None, description="Constructor(s) they drive for.")
    points: float = Field(..., description="Season points so far.")
    wins: int = Field(..., description="Number of race wins.")


class ConstructorStanding(BaseModel):
    """One row of the Constructors' Championship standings."""

    position: int = Field(..., description="Championship position (1 = leader).")
    name: str = Field(..., description="Constructor/team name.")
    nationality: str | None = Field(default=None, description="Team nationality.")
    points: float = Field(..., description="Season points so far.")
    wins: int = Field(..., description="Number of race wins.")


class StandingsResponse(BaseModel):
    """Payload for the championship standings (Drivers + Constructors).

    Represents standings as of the most recent COMPLETED grand prix.
    """

    season: int = Field(..., description="Season year.")
    round: int = Field(..., description="Round the standings are current up to.")
    drivers: list[DriverStanding] = Field(
        ..., description="Drivers' championship, ordered by position."
    )
    constructors: list[ConstructorStanding] = Field(
        ..., description="Constructors' championship, ordered by position."
    )
class TelemetryPoint(BaseModel):
    """A single sampled point along the track for one driver's lap.

    `distance` is the lap progress in metres and is used to ALIGN two drivers'
    laps against each other (distance travelled is comparable across laps).
    """

    distance: float = Field(..., description="Distance travelled along lap (m).")
    x: float = Field(..., description="Track X coordinate (metres, raw).")
    y: float = Field(..., description="Track Y coordinate (metres, raw).")
    speed_kmh: float = Field(..., description="Speed in km/h.")
    throttle_pct: float = Field(..., description="Throttle 0-100%.")
    brake: bool = Field(..., description="True if braking.")
    gear: int = Field(..., description="Selected gear (1-8).")
    drs: int = Field(..., description="DRS state (0 = off, 1 = on, 2 = eligible).")


class TrackPoint(BaseModel):
    """A point of the shared track geometry (position only)."""

    distance: float = Field(..., description="Distance travelled along lap (m).")
    x: float = Field(..., description="Track X coordinate (metres, raw).")
    y: float = Field(..., description="Track Y coordinate (metres, raw).")


class DriverLapTrace(BaseModel):
    """The sampled telemetry trace for one driver's chosen lap."""

    driver_code: str = Field(..., description="3-letter driver code.")
    lap_number: int = Field(..., description="The lap number used.")
    lap_time_ms: int | None = Field(
        None, description="Lap time in milliseconds (if known)."
    )
    points: list[TelemetryPoint] = Field(
        ..., description="Sampled telemetry, ordered by distance."
    )


class TelemetryComparisonResponse(BaseModel):
    """Dual-driver telemetry comparison for the telemetry track map.

    Provides: the shared track geometry, plus one sampled lap trace per driver.
    All points expose x/y/speed/throttle/brake/gear/drs and a `distance` value
    that lets the frontend align the two laps and compute deltas.
    """

    season: int = Field(..., description="Season year.")
    round: int = Field(..., description="Grand Prix round number.")
    event_name: str = Field(..., description="e.g. 'Dutch Grand Prix'.")
    session_type: str = Field(
        ..., description="Source session: 'Q', 'R', 'FP1', etc."
    )
    track: list[TrackPoint] = Field(
        ..., description="Shared track geometry (position + distance)."
    )
    drivers: list[DriverLapTrace] = Field(
        ...,
        description="One trace per driver. Order matches the requested driverA/driverB.",
    )

# --- Analytics (pace consistency & tire degradation) ------------------------


class PaceStats(BaseModel):
    """Descriptive stats of a driver's clean race-lap times."""

    count: int = Field(..., description="Number of clean laps used.")
    mean_s: float = Field(..., description="Mean clean-lap time (seconds).")
    median_s: float = Field(..., description="Median clean-lap time (seconds).")
    std_s: float = Field(..., description="Std deviation of clean-lap times.")
    cv_pct: float = Field(
        ..., description="Coefficient of variation (%). Lower = more consistent."
    )
    q1_s: float = Field(..., description="1st quartile lap time (s).")
    q3_s: float = Field(..., description="3rd quartile lap time (s).")
    min_s: float = Field(..., description="Fastest clean lap (s).")
    max_s: float = Field(..., description="Slowest clean lap (s).")


class KdePoint(BaseModel):
    """A single point on the lap-time distribution curve."""

    lap_time_s: float = Field(..., description="Lap time (s).")
    density: float = Field(..., description="Estimated probability density.")


class PaceResponse(BaseModel):
    """Pace consistency analytics for one driver in one session."""

    season: int = Field(..., description="Season year.")
    round: int = Field(..., description="Grand Prix round.")
    event_name: str = Field(..., description="e.g. 'Dutch Grand Prix'.")
    driver_code: str = Field(..., description="Driver analysed.")
    session_type: str = Field(..., description="e.g. 'R' (race).")
    stats: PaceStats = Field(..., description="Boxplot/descriptive stats.")
    kde: list[KdePoint] = Field(
        ..., description="Lap-time distribution curve for charting."
    )


class TireStint(BaseModel):
    """Degradation regression result for one tyre stint."""

    compound: str = Field(..., description="Tyre compound: SOFT/MEDIUM/HARD.")
    stint: int = Field(..., description="Stint number.")
    n_laps: int = Field(..., description="Laps in the stint used for the fit.")
    slope_s_per_lap: float = Field(
        ..., description="Degradation: extra seconds per lap as the stint ages."
    )
    intercept_s: float = Field(..., description="Fitted lap time at tyre age 0.")
    r2: float = Field(..., description="Goodness of fit (0-1).")


class TireDegradationResponse(BaseModel):
    """Tire degradation per stint for one driver in one session."""

    season: int = Field(..., description="Season year.")
    round: int = Field(..., description="Grand Prix round.")
    event_name: str = Field(..., description="e.g. 'Dutch Grand Prix'.")
    driver_code: str = Field(..., description="Driver analysed.")
    session_type: str = Field(..., description="e.g. 'R' (race).")
    stints: list[TireStint] = Field(
        ..., description="Degradation fit per stint, ordered by compound+stint."
    )
