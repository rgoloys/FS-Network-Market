import axios from "axios";
import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../api/base";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const EMPTY_PROFILE = {
  username: "",
  email: "",
  full_name: "",
  display_name: "",
  phone_number: "",
  date_of_birth: "",
  gender: "",
  country: "",
  city_province: "",
  address: "",
  postal_code: "",
  security_question: "",
  language_preference: "en",
  time_zone: "UTC",
  bio: "",
  interests: [],
  occupation_school: "",
  social_links: [],
};

const SECURITY_QUESTIONS = [
  "What was the name of your first school?",
  "What city were you born in?",
  "What was the name of your childhood best friend?",
  "What is the name of your favorite teacher?",
];

const GENDER_OPTIONS = [
  { label: "Select gender", value: "" },
  { label: "Female", value: "female" },
  { label: "Male", value: "male" },
  { label: "Non-binary", value: "non_binary" },
  { label: "Other", value: "other" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

const LANGUAGE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Filipino", value: "fil" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
];

const TIME_ZONE_OPTIONS = [
  "UTC",
  "Asia/Singapore",
  "Asia/Manila",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Australia/Sydney",
];

const inputClass =
  "min-h-[46px] w-full rounded-lg border border-[#d9d9d9] bg-white px-3.5 text-sm font-medium text-[#141414] outline-none transition focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  if (image.startsWith("/")) return `${BASE_URL.slice(0, -1)}${image}`;
  return `${BASE_URL}${image}`;
};

const getErrorMessage = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return getErrorMessage(data[0], fallback);
  if (typeof data === "object") {
    return getErrorMessage(Object.values(data)[0], fallback);
  }
  return fallback;
};

const normalizeProfile = (profile) => ({
  ...EMPTY_PROFILE,
  ...profile,
  date_of_birth: profile.date_of_birth ?? "",
  interests: Array.isArray(profile.interests) ? profile.interests : [],
  social_links: Array.isArray(profile.social_links) ? profile.social_links : [],
});

const FormField = ({ children, label }) => (
  <label className="flex flex-col gap-2 text-sm font-bold leading-none text-[#141414]">
    {label}
    {children}
  </label>
);

const SectionCard = ({ children, description, title }) => (
  <section className="rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_14px_34px_rgba(17,17,17,0.05)] max-[560px]:p-5">
    <div className="border-b border-[#ececec] pb-4">
      <h2 className="m-0 text-2xl font-bold leading-tight text-[#111111]">
        {title}
      </h2>
      <p className="m-0 mt-2 text-sm leading-[1.6] text-[#626262]">
        {description}
      </p>
    </div>
    {children}
  </section>
);

const Profile = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(EMPTY_PROFILE);
  const [initialSecurityQuestion, setInitialSecurityQuestion] = useState("");
  const [securitySelection, setSecuritySelection] = useState("");
  const [customSecurityQuestion, setCustomSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [securityCurrentPassword, setSecurityCurrentPassword] = useState("");
  const [interestDraft, setInterestDraft] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pageError, setPageError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const clearSessionAndRedirect = useCallback(
    (message = "Please log in to continue.") => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setIsAuthenticated(false);
      navigate("/login", { state: { message } });
    },
    [navigate, setIsAuthenticated],
  );

  const applyProfileResponse = useCallback((nextProfile) => {
    const question = nextProfile.security_question ?? "";
    const isPresetQuestion = SECURITY_QUESTIONS.includes(question);

    setProfile(nextProfile);
    setFormData(normalizeProfile(nextProfile));
    setInitialSecurityQuestion(question);
    setSecuritySelection(
      question ? (isPresetQuestion ? question : "custom") : "",
    );
    setCustomSecurityQuestion(isPresetQuestion ? "" : question);
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      clearSessionAndRedirect();
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${BASE_URL}user-profile/`, {
          headers: getAuthHeaders(),
        });
        applyProfileResponse(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          clearSessionAndRedirect();
          return;
        }
        setPageError("Unable to load your profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [applyProfileResponse, clearSessionAndRedirect]);

  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview],
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSecurityQuestionChange = (event) => {
    const value = event.target.value;
    setSecuritySelection(value);
    setFormData((current) => ({
      ...current,
      security_question: value === "custom" ? customSecurityQuestion : value,
    }));
  };

  const handleCustomSecurityQuestionChange = (event) => {
    const value = event.target.value;
    setCustomSecurityQuestion(value);
    setFormData((current) => ({ ...current, security_question: value }));
  };

  const addInterest = () => {
    const interest = interestDraft.trim();
    if (!interest || formData.interests.includes(interest)) return;
    setFormData((current) => ({
      ...current,
      interests: [...current.interests, interest],
    }));
    setInterestDraft("");
  };

  const removeInterest = (interestToRemove) => {
    setFormData((current) => ({
      ...current,
      interests: current.interests.filter(
        (interest) => interest !== interestToRemove,
      ),
    }));
  };

  const addSocialLink = () => {
    setFormData((current) => ({
      ...current,
      social_links: [...current.social_links, { label: "", url: "" }],
    }));
  };

  const updateSocialLink = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      social_links: current.social_links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link,
      ),
    }));
  };

  const removeSocialLink = (index) => {
    setFormData((current) => ({
      ...current,
      social_links: current.social_links.filter(
        (_, linkIndex) => linkIndex !== index,
      ),
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setPageError("");
    setProfileMessage("");
    setIsSavingProfile(true);

    const payload = {
      ...formData,
      social_links: formData.social_links.filter(
        (link) => link.label.trim() || link.url.trim(),
      ),
    };
    delete payload.security_question;

    const securityQuestionChanged =
      formData.security_question !== initialSecurityQuestion;
    if (securityQuestionChanged || securityAnswer.trim()) {
      payload.security_question = formData.security_question;
      payload.security_answer = securityAnswer;
      payload.current_password = securityCurrentPassword;
    }

    try {
      const response = await axios.patch(`${BASE_URL}user-profile/`, payload, {
        headers: getAuthHeaders(),
      });
      applyProfileResponse(response.data);
      setSecurityAnswer("");
      setSecurityCurrentPassword("");
      setProfileMessage("Your profile has been updated.");
    } catch (error) {
      if (error.response?.status === 401) {
        clearSessionAndRedirect();
        return;
      }
      setPageError(
        getErrorMessage(
          error.response?.data,
          "Unable to save your profile. Please review your details.",
        ),
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoSelection = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(selectedFile);
    setPhotoPreview(selectedFile ? URL.createObjectURL(selectedFile) : "");
    setPhotoMessage("");
    setPageError("");
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      setPageError("Choose a JPG, PNG, or WebP image before uploading.");
      return;
    }

    const payload = new FormData();
    payload.append("profile_photo", photoFile);
    setPageError("");
    setPhotoMessage("");
    setIsUploadingPhoto(true);

    try {
      const response = await axios.put(
        `${BASE_URL}user-profile/photo/`,
        payload,
        { headers: getAuthHeaders() },
      );
      setProfile((current) => ({
        ...current,
        profile_photo: response.data.profile_photo,
      }));
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview("");
      setPhotoMessage("Profile photo updated.");
    } catch (error) {
      if (error.response?.status === 401) {
        clearSessionAndRedirect();
        return;
      }
      setPageError(
        getErrorMessage(
          error.response?.data,
          "Unable to upload your profile photo.",
        ),
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoRemove = async () => {
    setPageError("");
    setPhotoMessage("");
    setIsUploadingPhoto(true);

    try {
      await axios.delete(`${BASE_URL}user-profile/photo/`, {
        headers: getAuthHeaders(),
      });
      setProfile((current) => ({ ...current, profile_photo: null }));
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview("");
      setPhotoMessage("Profile photo removed.");
    } catch (error) {
      if (error.response?.status === 401) {
        clearSessionAndRedirect();
        return;
      }
      setPageError("Unable to remove your profile photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setIsChangingPassword(true);

    try {
      await axios.post(`${BASE_URL}user-profile/password/`, passwordForm, {
        headers: getAuthHeaders(),
      });
      clearSessionAndRedirect(
        "Your password was updated. Please log in with your new password.",
      );
    } catch (error) {
      if (error.response?.status === 401) {
        clearSessionAndRedirect();
        return;
      }
      setPasswordError(
        getErrorMessage(
          error.response?.data,
          "Unable to change your password. Please review your details.",
        ),
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const photoUrl = photoPreview || getImageUrl(profile?.profile_photo);

  return (
    <PageLayout>
      <section className="box-border min-h-[680px] w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-7">
          <div className="flex flex-wrap items-end justify-between gap-4 text-left">
            <div className="flex flex-col gap-3">
              <span className="inline-flex min-h-[34px] w-fit items-center rounded-full border border-[#dedede] bg-white px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
                Profile
              </span>

              <p className="m-0 max-w-[680px] text-base leading-[1.65] text-[#626262]">
                Keep your personal details, preferences, and account security
                information up to date.
              </p>
            </div>
            <Link
              className="button-hover inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-5 text-sm font-bold leading-none text-[#141414] no-underline"
              to="/products"
            >
              View products
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-[#e8e8e8] bg-white p-8 text-left text-base font-semibold text-[#626262]">
              Loading profile...
            </div>
          ) : null}

          {pageError ? (
            <div className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
              {pageError}
            </div>
          ) : null}

          {profileMessage ? (
            <div className="rounded-lg border border-[#bfe6ca] bg-[#f2fff5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#1f7a39]">
              {profileMessage}
            </div>
          ) : null}

          {!isLoading && profile ? (
            <>
              <SectionCard
                title="Profile photo"
                description="Upload a clear JPG, PNG, or WebP image up to 5 MB."
              >
                <div className="mt-5 flex flex-wrap items-center gap-5">
                  <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#e3e3e3] bg-[#f2f2f2] text-3xl font-bold text-[#707070]">
                    {photoUrl ? (
                      <img
                        alt="Profile"
                        className="h-full w-full object-cover"
                        src={photoUrl}
                      />
                    ) : (
                      (formData.display_name || formData.username || "?")
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="block max-w-full text-sm font-medium text-[#626262] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#ededed] file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-[#141414]"
                      onChange={handlePhotoSelection}
                      type="file"
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#141414] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#767676]"
                        disabled={!photoFile || isUploadingPhoto}
                        onClick={handlePhotoUpload}
                        type="button"
                      >
                        {isUploadingPhoto ? "Saving..." : "Upload photo"}
                      </button>
                      {profile.profile_photo ? (
                        <button
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#f0c9c9] bg-white px-4 text-sm font-bold text-[#9f1d1d] disabled:cursor-not-allowed disabled:text-[#9a9a9a]"
                          disabled={isUploadingPhoto}
                          onClick={handlePhotoRemove}
                          type="button"
                        >
                          Remove photo
                        </button>
                      ) : null}
                    </div>
                    {photoMessage ? (
                      <p className="m-0 text-sm font-semibold text-[#1f7a39]">
                        {photoMessage}
                      </p>
                    ) : null}
                  </div>
                </div>
              </SectionCard>

              <form
                className="flex flex-col gap-6"
                onSubmit={handleProfileSubmit}
              >
                <SectionCard
                  title="Basic information"
                  description="Your account identity and personal details."
                >
                  <div className="mt-5 grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
                    <FormField label="Full name">
                      <input
                        className={inputClass}
                        name="full_name"
                        onChange={handleInputChange}
                        value={formData.full_name}
                      />
                    </FormField>
                    <FormField label="Display name">
                      <input
                        className={inputClass}
                        name="display_name"
                        onChange={handleInputChange}
                        value={formData.display_name}
                      />
                    </FormField>
                    <FormField label="Username">
                      <input
                        className={inputClass}
                        name="username"
                        onChange={handleInputChange}
                        required
                        value={formData.username}
                      />
                    </FormField>
                    <FormField label="Email address">
                      <input
                        className={inputClass}
                        name="email"
                        onChange={handleInputChange}
                        required
                        type="email"
                        value={formData.email}
                      />
                    </FormField>
                    <FormField label="Phone number">
                      <input
                        className={inputClass}
                        name="phone_number"
                        onChange={handleInputChange}
                        type="tel"
                        value={formData.phone_number}
                      />
                    </FormField>
                    <FormField label="Date of birth">
                      <input
                        className={inputClass}
                        name="date_of_birth"
                        onChange={handleInputChange}
                        type="date"
                        value={formData.date_of_birth}
                      />
                    </FormField>
                    <FormField label="Gender">
                      <select
                        className={inputClass}
                        name="gender"
                        onChange={handleInputChange}
                        value={formData.gender}
                      >
                        {GENDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Location"
                  description="Add the location details associated with your profile."
                >
                  <div className="mt-5 grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
                    <FormField label="Country">
                      <input
                        className={inputClass}
                        name="country"
                        onChange={handleInputChange}
                        value={formData.country}
                      />
                    </FormField>
                    <FormField label="City / province">
                      <input
                        className={inputClass}
                        name="city_province"
                        onChange={handleInputChange}
                        value={formData.city_province}
                      />
                    </FormField>
                    <FormField label="Address">
                      <input
                        className={inputClass}
                        name="address"
                        onChange={handleInputChange}
                        value={formData.address}
                      />
                    </FormField>
                    <FormField label="ZIP / postal code">
                      <input
                        className={inputClass}
                        name="postal_code"
                        onChange={handleInputChange}
                        value={formData.postal_code}
                      />
                    </FormField>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Account preferences and security"
                  description="Save preferences and protect security-question changes with your current password."
                >
                  <div className="mt-5 grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
                    <FormField label="Language preference">
                      <select
                        className={inputClass}
                        name="language_preference"
                        onChange={handleInputChange}
                        value={formData.language_preference}
                      >
                        {LANGUAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Time zone">
                      <select
                        className={inputClass}
                        name="time_zone"
                        onChange={handleInputChange}
                        value={formData.time_zone}
                      >
                        {TIME_ZONE_OPTIONS.map((timeZone) => (
                          <option key={timeZone} value={timeZone}>
                            {timeZone}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Security question">
                      <select
                        className={inputClass}
                        onChange={handleSecurityQuestionChange}
                        value={securitySelection}
                      >
                        <option value="">Select a security question</option>
                        {SECURITY_QUESTIONS.map((question) => (
                          <option key={question} value={question}>
                            {question}
                          </option>
                        ))}
                        <option value="custom">Custom question</option>
                      </select>
                    </FormField>
                    {securitySelection === "custom" ? (
                      <FormField label="Custom security question">
                        <input
                          className={inputClass}
                          onChange={handleCustomSecurityQuestionChange}
                          value={customSecurityQuestion}
                        />
                      </FormField>
                    ) : null}
                    <FormField label="Security answer">
                      <input
                        className={inputClass}
                        onChange={(event) =>
                          setSecurityAnswer(event.target.value)
                        }
                        placeholder={
                          profile.security_answer_configured
                            ? "Enter a new answer to replace the saved answer"
                            : "Enter an answer"
                        }
                        type="password"
                        value={securityAnswer}
                      />
                    </FormField>
                    <FormField label="Current password for security changes">
                      <input
                        className={inputClass}
                        onChange={(event) =>
                          setSecurityCurrentPassword(event.target.value)
                        }
                        placeholder="Required only when updating security question"
                        type="password"
                        value={securityCurrentPassword}
                      />
                    </FormField>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Personal details"
                  description="Share a little more about yourself and the links you care about."
                >
                  <div className="mt-5 flex flex-col gap-4">
                    <FormField label="Bio / about me">
                      <textarea
                        className={`${inputClass} min-h-28 py-3 leading-[1.6]`}
                        name="bio"
                        onChange={handleInputChange}
                        value={formData.bio}
                      />
                    </FormField>
                    <FormField label="Occupation / school">
                      <input
                        className={inputClass}
                        name="occupation_school"
                        onChange={handleInputChange}
                        value={formData.occupation_school}
                      />
                    </FormField>
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-bold leading-none text-[#141414]">
                        Interests
                      </span>
                      <div className="flex gap-2 max-[560px]:flex-col">
                        <input
                          className={inputClass}
                          onChange={(event) =>
                            setInterestDraft(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addInterest();
                            }
                          }}
                          placeholder="Add an interest"
                          value={interestDraft}
                        />
                        <button
                          className="inline-flex min-h-[46px] shrink-0 items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-4 text-sm font-bold text-[#141414]"
                          onClick={addInterest}
                          type="button"
                        >
                          Add interest
                        </button>
                      </div>
                      {formData.interests.length ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {formData.interests.map((interest) => (
                            <span
                              className="inline-flex items-center gap-2 rounded-full bg-[#ededed] px-3 py-2 text-sm font-semibold text-[#414141]"
                              key={interest}
                            >
                              {interest}
                              <button
                                aria-label={`Remove ${interest}`}
                                className="grid size-5 place-items-center rounded-full border-0 bg-[#141414] text-xs font-bold leading-none text-white"
                                onClick={() => removeInterest(interest)}
                                type="button"
                              >
                                x
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm font-bold leading-none text-[#141414]">
                          Website or social links
                        </span>
                        <button
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-4 text-sm font-bold text-[#141414]"
                          onClick={addSocialLink}
                          type="button"
                        >
                          Add link
                        </button>
                      </div>
                      {formData.social_links.map((link, index) => (
                        <div
                          className="grid grid-cols-[180px_minmax(0,1fr)_auto] gap-3 max-[700px]:grid-cols-1"
                          key={index}
                        >
                          <input
                            aria-label="Link label"
                            className={inputClass}
                            onChange={(event) =>
                              updateSocialLink(
                                index,
                                "label",
                                event.target.value,
                              )
                            }
                            placeholder="Label, e.g. LinkedIn"
                            value={link.label}
                          />
                          <input
                            aria-label="Link URL"
                            className={inputClass}
                            onChange={(event) =>
                              updateSocialLink(index, "url", event.target.value)
                            }
                            placeholder="https://example.com"
                            type="url"
                            value={link.url}
                          />
                          <button
                            className="inline-flex min-h-[46px] items-center justify-center rounded-lg border border-[#f0c9c9] bg-white px-4 text-sm font-bold text-[#9f1d1d]"
                            onClick={() => removeSocialLink(index)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>

                <button
                  className="inline-flex min-h-[52px] w-fit items-center justify-center self-end rounded-lg bg-[#141414] px-6 text-base font-bold text-white disabled:cursor-not-allowed disabled:bg-[#767676] max-[560px]:w-full"
                  disabled={isSavingProfile}
                  type="submit"
                >
                  {isSavingProfile ? "Saving profile..." : "Save profile"}
                </button>
              </form>

              <form onSubmit={handlePasswordSubmit}>
                <SectionCard
                  title="Change password"
                  description="Choose a strong password. You will log in again after this change."
                >
                  <div className="mt-5 grid grid-cols-3 gap-4 max-[800px]:grid-cols-1">
                    <FormField label="Current password">
                      <input
                        className={inputClass}
                        name="current_password"
                        onChange={handlePasswordChange}
                        required
                        type="password"
                        value={passwordForm.current_password}
                      />
                    </FormField>
                    <FormField label="New password">
                      <input
                        className={inputClass}
                        minLength={8}
                        name="new_password"
                        onChange={handlePasswordChange}
                        required
                        type="password"
                        value={passwordForm.new_password}
                      />
                    </FormField>
                    <FormField label="Confirm password">
                      <input
                        className={inputClass}
                        minLength={8}
                        name="confirm_password"
                        onChange={handlePasswordChange}
                        required
                        type="password"
                        value={passwordForm.confirm_password}
                      />
                    </FormField>
                  </div>
                  {passwordError ? (
                    <p className="m-0 mt-4 rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
                      {passwordError}
                    </p>
                  ) : null}
                  <button
                    className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#141414] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#767676]"
                    disabled={isChangingPassword}
                    type="submit"
                  >
                    {isChangingPassword
                      ? "Updating password..."
                      : "Change password"}
                  </button>
                </SectionCard>
              </form>
            </>
          ) : null}
        </div>
      </section>
    </PageLayout>
  );
};

export default Profile;
