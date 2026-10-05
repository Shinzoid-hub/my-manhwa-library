// ==================================================
// SUPABASE CONFIGURATION
// ==================================================

const SUPABASE_URL =
    "https://osxiywkbelxqpcelpvyc.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_DQqvxjHWap2PefUIxlu7hw_E6JSaNZX";


// ==================================================
// CONNECT TO SUPABASE
// ==================================================

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ==================================================
// GET HTML ELEMENTS
// ==================================================

const form = document.getElementById("titleForm");
const grid = document.getElementById("cardsGrid");


// Debug information
console.log("=================================");
console.log("My Manhwa Library");
console.log("Supabase connected");
console.log("FORM:", form);
console.log("GRID:", grid);
console.log("=================================");


// ==================================================
// CHECK HTML
// ==================================================

if (!form) {
    console.error(
        "ERROR: Element #titleForm was not found!"
    );
}

if (!grid) {
    console.error(
        "ERROR: Element #cardsGrid was not found!"
    );
}


// ==================================================
// LOAD BOOKS FROM SUPABASE
// ==================================================

async function fetchCards() {

    if (!grid) {
        return;
    }

    grid.innerHTML = `
        <p>Loading your library...</p>
    `;


    const {
        data,
        error
    } = await supabaseClient
        .from("gl_books")
        .select("*")
        .order("id", {
            ascending: false
        });


    // Supabase error
    if (error) {

        console.error(
            "Supabase SELECT error:",
            error
        );

        grid.innerHTML = `
            <div style="color: red; padding: 20px;">
                <h3>❌ Failed to load library</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;

        return;
    }


    console.log(
        "Books loaded:",
        data
    );


    renderCards(data || []);
}


// ==================================================
// DELETE BOOK
// ==================================================

async function deleteItem(id) {

    const confirmed = confirm(
        "Delete this title from cloud?"
    );


    if (!confirmed) {
        return;
    }


    console.log(
        "Deleting book:",
        id
    );


    const {
        error
    } = await supabaseClient
        .from("gl_books")
        .delete()
        .eq("id", id);


    if (error) {

        console.error(
            "Supabase DELETE error:",
            error
        );

        alert(
            "Failed to delete:\n\n" +
            error.message
        );

        return;
    }


    console.log(
        "Book deleted successfully."
    );


    await fetchCards();
}


// ==================================================
// RENDER BOOK CARDS
// ==================================================

function renderCards(books) {

    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    // No books
    if (!books || books.length === 0) {

        grid.innerHTML = `
            <div style="padding: 20px;">
                <h3>📚 Your library is empty</h3>
                <p>Add your first title above.</p>
            </div>
        `;

        return;
    }


    // Create cards
    books.forEach((item) => {

        const card =
            document.createElement("div");

        card.className = "card";


        // Image
        const imgUrl =
            item.img &&
            item.img.trim()
                ? item.img
                : "https://placehold.co/300x420?text=No+Cover";


        // Status
        const statusClass =
            item.completed
                ? "status-completed"
                : "status-ongoing";


        const statusText =
            item.completed
                ? "✓ Finished"
                : "⏳ Ongoing / Reading";


        // Card HTML
        card.innerHTML = `

            <button
                class="delete-btn"
                onclick="deleteItem(${item.id})"
                title="Delete"
            >
                ✕
            </button>


            <img
                class="card-img"
                src="${escapeHTML(imgUrl)}"
                alt="Cover"
                onerror="
                    this.src='https://placehold.co/300x420?text=No+Cover'
                "
            >


            <div class="card-body">

                <h3 class="card-name">
                    ${escapeHTML(item.name || "Untitled")}
                </h3>


                <div class="info-row">

                    <span class="info-label">
                        My Rating:
                    </span>

                    <strong>
                        ${escapeHTML(item.rating || "—")}
                    </strong>

                </div>


                <div class="info-row">

                    <span class="info-label">
                        Chapters Read:
                    </span>

                    <strong>
                        ${item.chapter ?? 0}
                    </strong>

                </div>


                <span
                    class="status-badge ${statusClass}"
                >
                    ${statusText}
                </span>

            </div>
        `;


        grid.appendChild(card);

    });

}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}


// ==================================================
// ADD NEW BOOK
// ==================================================

if (form) {

    form.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            console.log(
                "Form submitted."
            );


            // ------------------------------------------
            // GET VALUES
            // ------------------------------------------

            const name =
                document
                    .getElementById("titleName")
                    .value
                    .trim();


            const img =
                document
                    .getElementById("titleImg")
                    .value
                    .trim();


            const rating =
                document
                    .getElementById("titleRating")
                    .value;


            const chapterValue =
                document
                    .getElementById("titleChapter")
                    .value;


            const completed =
                document
                    .getElementById("titleCompleted")
                    .checked;


            // ------------------------------------------
            // VALIDATE TITLE
            // ------------------------------------------

            if (!name) {

                alert(
                    "Please enter a title name."
                );

                return;
            }


            // ------------------------------------------
            // VALIDATE CHAPTER
            // ------------------------------------------

            const chapter =
                parseInt(
                    chapterValue,
                    10
                );


            if (
                isNaN(chapter) ||
                chapter < 0
            ) {

                alert(
                    "Please enter a valid chapter number."
                );

                return;
            }


            // ------------------------------------------
            // CREATE OBJECT
            // ------------------------------------------

            const newItem = {

                name: name,

                img: img || null,

                rating: rating,

                chapter: chapter,

                completed: completed

            };


            console.log(
                "Adding book:",
                newItem
            );


            // ------------------------------------------
            // INSERT INTO SUPABASE
            // ------------------------------------------

            const {
                data,
                error
            } = await supabaseClient

                .from("gl_books")

                .insert([
                    newItem
                ])

                .select();


            // ------------------------------------------
            // ERROR
            // ------------------------------------------

            if (error) {

                console.error(
                    "Supabase INSERT error:",
                    error
                );


                alert(
                    "Failed to save to cloud.\n\n" +
                    error.message
                );


                return;
            }


            // ------------------------------------------
            // SUCCESS
            // ------------------------------------------

            console.log(
                "Book added successfully:",
                data
            );


            // Clear form
            form.reset();


            // Reload library
            await fetchCards();

        }
    );

}


// ==================================================
// START APPLICATION
// ==================================================

fetchCards();

