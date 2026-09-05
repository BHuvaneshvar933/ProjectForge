import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import PageHeader from "../../components/common/PageHeader";
import { getMyProfile, updateMyProfile } from "../../api/userApi";

import AccountProfile from "./components/AccountProfile";
import AccountDetails from "./components/AccountDetails";

import "./Account.css";

const normalizeLinks = (links) => {
  const obj = links && typeof links === "object" ? links : {};
  return {
    github: typeof obj.github === "string" ? obj.github : "",
    linkedin: typeof obj.linkedin === "string" ? obj.linkedin : "",
    website: typeof obj.website === "string" ? obj.website : "",
  };
};

const formFingerprint = (form) => {
  const skills = Array.isArray(form?.skills) ? form.skills : [];
  const skillIds = skills
    .map((s) => (typeof s === "string" ? s : s?._id))
    .filter(Boolean)
    .map(String)
    .sort();

  const links = normalizeLinks(form?.portfolioLinks);

  return JSON.stringify({
    name: String(form?.name || ""),
    bio: String(form?.bio || ""),
    availabilityHoursPerWeek: Number(form?.availabilityHoursPerWeek || 0),
    portfolioLinks: {
      github: links.github,
      linkedin: links.linkedin,
      website: links.website,
    },
    skills: skillIds,
  });
};

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    availabilityHoursPerWeek: 0,
    portfolioLinks: { github: "", linkedin: "", website: "" },
    skills: [],
  });

  const baselineRef = useRef("");

  const isDirty = useMemo(() => {
    return baselineRef.current !== "" && formFingerprint(form) !== baselineRef.current;
  }, [form]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyProfile();
      const me = res.data?.data?.user ?? null;
      setUser(me);

      const nextForm = {
        name: me?.name || "",
        bio: me?.bio || "",
        availabilityHoursPerWeek: Number(me?.availabilityHoursPerWeek || 0),
        portfolioLinks: normalizeLinks(me?.portfolioLinks),
        skills: Array.isArray(me?.skills) ? me.skills : [],
      };

      setForm(nextForm);
      baselineRef.current = formFingerprint(nextForm);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load account");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Warn on reload/close if there are unsaved changes.
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e) => {
      e.preventDefault();
      // Most browsers ignore custom text but require returnValue to show a prompt.
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const onSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const skillIds = (form.skills || [])
        .map((s) => (typeof s === "string" ? s : s?._id))
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        bio: form.bio || "",
        availabilityHoursPerWeek: Number(form.availabilityHoursPerWeek || 0),
        portfolioLinks: normalizeLinks(form.portfolioLinks),
        skills: skillIds,
      };

      const res = await updateMyProfile(payload);
      const updated = res.data?.data?.user;
      setUser(updated || user);
      if (updated) {
        const nextForm = {
          name: updated?.name || "",
          bio: updated?.bio || "",
          availabilityHoursPerWeek: Number(updated?.availabilityHoursPerWeek || 0),
          portfolioLinks: normalizeLinks(updated?.portfolioLinks),
          skills: Array.isArray(updated?.skills) ? updated.skills : [],
        };
        setForm(nextForm);
        baselineRef.current = formFingerprint(nextForm);
      } else {
        baselineRef.current = formFingerprint(form);
      }
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="project-detail__loading">
        <Spinner size="lg" />
        <p className="project-detail__loading-text">Loading account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account">
        <PageHeader
          title="Account"
          actions={
            <Button variant="outline" onClick={fetchProfile}>Refresh</Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="account">
      <PageHeader
        title="Account"
        actions={
          <>
            <Button
              variant="ghost"
              className="btn-account-reset"
              onClick={() => {
                if (isDirty && !window.confirm("You have unsaved changes. Discard them?")) return;
                fetchProfile();
              }}
              disabled={saving}
            >
              Reset
            </Button>
            <Button variant="primary" onClick={onSave} loading={saving}>
              Save Changes
            </Button>
          </>
        }
      />

      <div className="account__grid">
        <AccountProfile form={form} setForm={setForm} />
        <AccountDetails user={user} />
      </div>
    </div>
  );
}
