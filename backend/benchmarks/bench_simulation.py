"""Benchmark: compare scalar vs vectorized Monte Carlo engine.

Run with:  python benchmarks/bench_simulation.py
"""
import time

from app.services.simulation_engine import DriverInput, run_monte_carlo


def make_grid(n_drivers: int = 20):
    """Build a realistic-ish grid of n_drivers with descending ratings."""
    drivers = []
    for i in range(n_drivers):
        rating = 2.0 * (1 - i / n_drivers)
        drivers.append(
            DriverInput(
                code=f"D{i:02d}",
                constructor_code=f"T{(i % 5) + 1}",   # 5 teams x 4 drivers
                points=float((n_drivers - i) * 10),
                rating=rating,
                dnf_probability=0.05,
            )
        )
    return drivers


def bench(label: str, drivers, remaining_races: int, n_simulations: int, seed: int = 1):
    start = time.perf_counter()
    result = run_monte_carlo(
        drivers=drivers,
        remaining_races=remaining_races,
        n_simulations=n_simulations,
        seed=seed,
    )
    elapsed = time.perf_counter() - start
    top = result["drivers"][0]
    print(
        f"  {label:<28} {elapsed:7.3f}s   "
        f"({n_simulations / elapsed:>10,.0f} seasons/sec)   "
        f"top: {top['code']} {top['win_probability']*100:.1f}%"
    )
    return elapsed


if __name__ == "__main__":
    grid = make_grid(20)
    print("Monte Carlo engine benchmark (20 drivers, 10 races remaining)")
    print("-" * 78)
    for n in (1_000, 10_000, 50_000):
        bench(f"n_simulations={n:,}", grid, 10, n)
