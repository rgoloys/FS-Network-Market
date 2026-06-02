import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../api/base";
import PageLayout from "../components/PageLayout";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${BASE_URL}register/`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      navigate("/login");
    } catch (err) {
      const responseErrors = err.response?.data;
      const message =
        responseErrors?.username?.[0] ??
        responseErrors?.email?.[0] ??
        responseErrors?.password?.[0] ??
        responseErrors?.detail ??
        "Registration failed. Please check your details and try again.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <section className="box-border flex min-h-[680px] w-full items-center justify-center bg-[#f7f7f7] px-16 py-20 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <form
          className="flex w-full max-w-[500px] flex-col gap-5 rounded-lg border border-[#e8e8e8] bg-white p-8 text-left shadow-[0_18px_40px_rgba(17,17,17,0.08)] max-[560px]:p-6"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold leading-none text-[#6b6b6b]">Create account</span>
            <h1 className="m-0 text-[36px] font-bold leading-[1.1] text-[#111111]">Register</h1>
          </div>
          <label className="flex flex-col gap-2 text-sm font-bold leading-none text-[#141414]">
            Username
            <input
              className="min-h-[48px] rounded-lg border border-[#d9d9d9] px-4 text-base font-medium outline-none focus:border-[#141414]"
              name="username"
              onChange={handleChange}
              required
              type="text"
              value={formData.username}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold leading-none text-[#141414]">
            Email
            <input
              className="min-h-[48px] rounded-lg border border-[#d9d9d9] px-4 text-base font-medium outline-none focus:border-[#141414]"
              name="email"
              onChange={handleChange}
              required
              type="email"
              value={formData.email}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold leading-none text-[#141414]">
            Password
            <input
              className="min-h-[48px] rounded-lg border border-[#d9d9d9] px-4 text-base font-medium outline-none focus:border-[#141414]"
              minLength={8}
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={formData.password}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold leading-none text-[#141414]">
            Confirm password
            <input
              className="min-h-[48px] rounded-lg border border-[#d9d9d9] px-4 text-base font-medium outline-none focus:border-[#141414]"
              minLength={8}
              name="confirmPassword"
              onChange={handleChange}
              required
              type="password"
              value={formData.confirmPassword}
            />
          </label>
          {error && (
            <p className="m-0 rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
              {error}
            </p>
          )}
          <button
            className="mt-2 inline-flex min-h-[52px] cursor-pointer items-center justify-center rounded-lg border-0 bg-[#141414] px-6 text-base font-bold leading-none text-white disabled:cursor-not-allowed disabled:bg-[#767676]"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
          <p className="m-0 text-center text-sm font-medium leading-[1.5] text-[#626262]">
            Already have an account?{" "}
            <Link className="font-bold text-[#141414] no-underline" to="/login">
              Log in
            </Link>
          </p>
        </form>
      </section>
    </PageLayout>
  );
};

export default Register;
