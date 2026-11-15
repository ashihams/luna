import json
import numpy as np
from pipeline.validate import horizons_check as check


def test_horizons_api_failure_cannot_pass(monkeypatch, tmp_path):
    docs = tmp_path / "docs"
    docs.mkdir()
    (docs / "VALIDATION.md").write_text("## V3 – Horizons Cross-Check (Section 16)\n\n**Status**: PASS\n\n## V4 – PGDA Map Comparison\n", encoding="utf-8")
    monkeypatch.setattr(check, "project_root", lambda: tmp_path)
    monkeypatch.setattr(check, "furnish_kernels", lambda: None)
    monkeypatch.setattr(check.spice, "str2et", lambda _: 0)
    monkeypatch.setattr(check.spice, "spkpos", lambda *args: (np.array([1e8, 0., 0.]), 0))
    def unavailable(*args):
        raise TimeoutError("reference unavailable")
    monkeypatch.setattr(check, "query_horizons_api", unavailable)
    assert check.run_horizons_cross_check() is False
    report = json.loads((docs / "horizons-results.json").read_text())
    assert report["status"] == "INCOMPLETE"
    assert report["completed_count"] == 0
    assert len(report["errors"]) == report["expected_count"] == 12
    assert "**Status**: INCOMPLETE" in (docs / "VALIDATION.md").read_text(encoding="utf-8")
