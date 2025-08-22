# Checklist

<!-- Make sure you fill out this checklist with what you've done before submitting! -->

- [(✓) ] Read the README [please please please]
- [(✓) ] Something cool!
- [(✓) ] Back-end
  - [ (✓)] Minimum Requirements
    - [ (✓)] Setup MongoDB database
    - [(✓) ] Setup item requests collection
    - [(✓) ] `PUT /api/request`
    - [ (✓)] `GET /api/request?page=_`
  - [ (✓)] Main Requirements
    - [(✓) ] `GET /api/request?status=pending`
    - [ (✓)] `PATCH /api/request`
  - [ (✓)] Above and Beyond
    - [ (✓)] Batch edits
    - [ (✓)] Batch deletes
- [ ] Front-end
  - [ ] Minimum Requirements
    - [ ] Dropdown component
    - [ ] Table component
    - [ ] Base page [table with data]
    - [ ] Table dropdown interactivity
  - [ ] Main Requirements
    - [ ] Pagination
    - [ ] Tabs
  - [ ] Above and Beyond
    - [ ] Batch edits
    - [ ] Batch deletes

# Notes

<!-- Notes go here -->
## Create Request
**PUT** `/api/request`

Create a new item request.  

**Body Parameters**
- `requestorName` *(string, required, 3–30 chars)*  
- `itemRequested` *(string, required, 2–100 chars)*  

---

## Get Requests
**GET** `/api/request?page={page}&status={status}`

Retrieve item requests with pagination and optional status filter.  

**Query Parameters**
- `page` *(number, optional, default = 1)* – page number for pagination  
- `status` *(string, optional)* – filter by status (`pending`, `approved`, `completed`, `rejected`)  

---

## Update Request (Single)
**PATCH** `/api/request`

Update the status of a single request.  

**Body Parameters**
- `id` *(number, required)* – ID of the request to update  
- `status` *(string, required)* – new status (`pending`, `approved`, `completed`, `rejected`)  

---

## Update Requests (Batch)
**PATCH** `/api/request`

Batch update the status of multiple requests.  

**Body Parameters**
- `updates` *(array, required)* – list of update objects  
  - `id` *(number, required)* – ID of the request  
  - `status` *(string, required)* – new status  

---

## Delete Requests (Batch)
**DELETE** `/api/request`

Batch delete multiple requests.  

**Body Parameters**
- `ids` *(array<number>, required)* – list of request IDs to delete