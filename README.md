# FS Network Market

FS Network Market is a beginner-friendly full-stack ecommerce application for
browsing enterprise networking equipment. It includes a React storefront and a
Django REST Framework API.

## Features

- Public product browsing and product details
- JWT login and account registration
- Authenticated cart with add, quantity update, and remove actions
- Editable user profile with photo upload, preferences, and password changes
- Responsive catalog cards with cached product requests and lazy-loaded images

## Project Structure

```text
backend/   Django REST Framework API
frontend/  React, Vite, and Tailwind CSS storefront
```

## Backend Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:

   ```powershell
   pip install -r backend/requirements.txt
   ```

3. Copy `backend/.env.example` to `backend/.env`.
4. Add PostgreSQL values to `backend/.env`, or leave `DB_HOST` empty to use
   local SQLite.
5. Apply migrations and optionally load the sample catalog:

   ```powershell
   cd backend
   python manage.py migrate
   python manage.py loaddata products_fixture.json
   python manage.py runserver
   ```

## Frontend Setup

1. Copy `frontend/.env.example` to `frontend/.env` if the API is not running at
   `http://127.0.0.1:8000/`.
2. Install dependencies and start Vite:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. Open `http://127.0.0.1:5173/`.

## API Routes

- `GET /products/`
- `GET /products/<id>/`
- `POST /register/`
- `POST /api/token/`
- `GET /cart/`
- `POST /cart/add/`
- `PATCH /cart/update/<id>/`
- `DELETE /cart/remove/<id>/`
- `GET/PATCH /user-profile/`
- `PUT/DELETE /user-profile/photo/`
- `POST /user-profile/password/`
