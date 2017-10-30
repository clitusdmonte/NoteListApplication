jQuery(document).ready(function ($) {
    console.log("app.js loaded")
    var objStoreName = "noteAppDB";
    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB.")

    }
    var db;
    var name;
    var openRequest = indexedDB.open("noteAppDB");
    openRequest.onupgradeneeded = function (e) {
        console.log("Creating or Upgrading DB...");
        var thisDB = e.target.result;
        if (!thisDB.objectStoreNames.contains("noteAppDBStore")) {
            thisDB.createObjectStore("noteAppDBStore", {autoIncrement: true});
        }
    }

    openRequest.onsuccess = function Add(e) {
        console.log("Open Success!");
        db = e.target.result;
        document.getElementById('btnAddNote').addEventListener('click', function () {
            name = document.getElementById('nameTextInput').value.trim();
            var subj = document.getElementById('subTextInput').value.trim();
            var msg = document.getElementById('msgTextInput').value.trim();
            var date = new Date().toLocaleString();
            var check = false;
            if (name == "") {
                alert("Please enter Name");
                check = true;
            } else if (msg == "") {
                alert("Please enter Message");
                check = true;
            } else if (subj == "") {
                alert("Please enter Subject for your Message");
                check = true;
            }
            if (check == false) {
                addNoteToDB(name, subj, msg, date);
            }

        });
            noteTableList();
    }

    openRequest.onerror = function (e) {
        console.log("Open Error!");
        console.dir(e);
    }

    function addNoteToDB(name, subj, msg, date) {
        console.log('Adding Note: ' + name + ',' + subj + ',' + msg + ',' + date);
        var transaction = db.transaction(["noteAppDBStore"], "readwrite");
        var store = transaction.objectStore("noteAppDBStore");
        var request = store.add({
            name: name,
            subject: subj,
            message: msg,
            date: date
        });
        request.onerror = function (e) {
            console.log("Error", e.target.error.name);

        }

        request.onsuccess = function (e) {
            console.log("added " + name, subj, msg, date);
            document.getElementById('nameTextInput').value = '';
            document.getElementById('subTextInput').value = '';
            document.getElementById('msgTextInput').value = '';
            // document.getElementById('time').value = '';
            noteTableList();
        }
    }

    var key;
    var value;

    function noteTableList() {
        var transaction = db.transaction('noteAppDBStore', 'readonly');
        var store = transaction.objectStore('noteAppDBStore');
        var countRequest = store.count();
        countRequest.onsuccess = function () {
            $('#countOfNotes').html('Number of Notes: ' + countRequest.result + '<br>');
            $('#countOfNotes').html(' <button type="button" class="btn btn-primary">Number of Notes: <span class="badge">' + countRequest.result + '</span></button>');

        };
        key = [];
        value = [];
        $('#tBodyNote').empty();
        var request = store.openCursor();
        request.onsuccess = function (e) {
            var cursor = e.target.result;
            if (cursor) {
                key.push(cursor.key);
                value.push(cursor.value);
                cursor.continue();
            }
        };
        transaction.oncomplete = function (e) {
            for (var i = 0; i < key.length; i++) {
                $('tbody#tBodyNote').append('<tr><td>' + value[i].subject + '</td><td>' + value[i].message.length + '</td><td>' + value[i].date + '</td><td><button id="view" class="btn" data-key="' + key[i] + '" style="color:black; background-color: darkgray; border-radius: 8px;border: 1px solid #008CBA;">View Details</button></td><td><button id="edit" class="btn" data-key="' + key[i] + '" style="color:black; background-color: darkgray; border-radius: 8px;border: 1px solid #008CBA;">Edit</button></td><td><button id="del" class="btn" data-key="' + key[i] + '" style="color:black; background-color: darkgray; border-radius: 8px;border: 1px solid #008CBA;">Delete</button></td></tr>');
            }
        };
    }

    function deleteNote(key) {
        $('#btnAddNote').prop('disabled',false );
        $('#btnEditNote').prop('disabled',true);
        $('#btnCancelEditNote').prop('hidden',true);
        var transaction = db.transaction(['noteAppDBStore'], 'readwrite');
        var store = transaction.objectStore('noteAppDBStore');
        var request = store.delete(key);
        request.onsuccess = function(evt){
            noteTableList();

            $('#btnAddNote').prop('disabled',false );
            $('#btnEditNote').prop('disabled',true);
            $('#btnCancelEditNote').prop('hidden',true);
            $('#nameTextInput').val('');
            $('#subTextInput').val('');
            $('#msgTextInput').val('');

            $('#form').show();
            $('#detailedNote').hide();
           // $('#detail').empty();
          //  document.getElementById('form').style.display="none";
        };
    }

    function editNote(id)
    {
        var transaction = db.transaction(["noteAppDBStore"]);
        var objectStore = transaction.objectStore("noteAppDBStore");
        var request = objectStore.get(id);


        request.onerror = function(event) {
            alert("Unable to get data from DB"+event);
        };

        request.onsuccess = function(event) {
            if(request.result) {
                $('#nameTextInput').val(request.result.name);
                $('#subTextInput').val(request.result.subject);
                $('#msgTextInput').val(request.result.message);
                $('#btnAddNote').prop('disabled',true );
                $('#btnEditNote').prop('disabled',false);
                $('#btnCancelEditNote').prop('hidden',false);
                $('#form').show();
                $('#detailedNote').hide();
                $('#btnCancelDetailedMode').prop('hidden',true);




                document.getElementById('btnEditNote').setAttribute('data-key',+id);

            } else {
                alert("No Notes found in your database!");
            }

        };

    }

    document.getElementById('btnCancelEditNote').addEventListener('click', function () {
        $('#btnAddNote').prop('disabled',false );
        $('#btnEditNote').prop('disabled',true);
        $('#btnCancelEditNote').prop('hidden',true);
        $('#nameTextInput').val('');
        $('#subTextInput').val('');
        $('#msgTextInput').val('');

    });

    function detailedNote(key){

        var transaction = db.transaction(['noteAppDBStore'], 'readonly');
        var store = transaction.objectStore('noteAppDBStore');
        var request = store.get(key);
        request.onerror = function(event) {
            alert("No Notes found in your database!");

        };
        request.onsuccess = function(event) {

            $('#detailedNote').html('<br>' + '<h4>' + 'Detailed View' + '</h4>' +'<br>' + 'Name: ' + request.result.name + '<br>'+ ' Subject: '+ request.result.subject+ '<br>'+ 'Message: ' + request.result.message +'<br>'+ 'Message Length: '+request.result.message.length +'<br>'+'Date: '+ request.result.date+'<br>');

            $('#btnCancelDetailedMode').prop('hidden',false);
            $('#btnCancelEditNote').prop('hidden',true);
            $('#form').hide();
            $('#detailedNote').show();
        };
    }

    document.getElementById('btnCancelDetailedMode').addEventListener('click', function () {
        $('#btnCancelDetailedMode').prop('hidden',true);
        $('#form').show();
        $('#detailedNote').hide();
        $('#nameTextInput').val('');
        $('#subTextInput').val('');
        $('#msgTextInput').val('');

    });

    $(document).on('click', 'button#view', function(){
        detailedNote(parseInt($(this).attr('data-key')));
    });
    $(document).on('click', 'button#edit', function(){
        editNote(parseInt($(this).attr('data-key')));
    });
    $(document).on('click', 'button#del', function(){
       // document.getElementById('form').style.display="none";
        deleteNote(parseInt($(this).attr('data-key')));
    });
    $(document).on('click', 'button#btnEditNote', function(){
        // document.getElementById('form').style.display="none";
        updateNote(parseInt($(this).attr('data-key')));
    });


   function updateNote(id){
        var name = document.getElementById('nameTextInput').value;
        var subj = document.getElementById('subTextInput').value;
        var msg = document.getElementById('msgTextInput').value;
        var key = id;

        var date =  new Date().toLocaleString();
        var transaction = db.transaction(["noteAppDBStore"],"readwrite");
        var store = transaction.objectStore("noteAppDBStore");

        var request = store.put({
            name: name,
            subject: subj,
            message: msg,
            date: date },id);

        request.onsuccess = function(event) {
            $('#nameTextInput').val('');
            $('#subTextInput').val('');
            $('#msgTextInput').val('');
            $('#edit-btn').prop('disabled',true);
            $('#add-btn').prop('disabled',false);
            $('#tblBody').empty();
            noteTableList();
            $('#btnAddNote').prop('disabled',false );
            $('#btnEditNote').prop('disabled',true);
            $('#btnCancelEditNote').prop('hidden',true);
        };

        request.onerror = function(event) {
            alert("Unable to add data to your database! ");
        }

    }

});