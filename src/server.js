import express from "express";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

//with this function we are refactoring our general code, avoiding repetitions (DRY - don't repeat yourself!)
const withDB = async (operations, res) => {
    try {

        const client = await MongoClient.connect('mongodb://localhost:27017');
        const db = client.db('my-blog');

        await operations(db);
    
        await client.close();

    } catch (error) {
        res.status(500).json({ message: 'sss Error connecting to DB', error });
    }

}

//simple API postman test
app.get('/hello', (req, res) => res.send('Hello ooo!'));

app.get('/hello/:name', (req, res) => res.send(`Howdy ${req.params.name}`));

app.post('/hello', (req, res) => res.send(`Hello to the legend ${req.body.name}!`));

// postman test ends here

//Get articleInfo refactored
app.get('/api/articles/:name', async (req,res) => {
    withDB( async (db) => {
        const articleName = req.params.name;
    
        //from the url you can find the articleName on the db
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articleInfo);
    }, res);
    
});

//Upvote section refactored
app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB( async (db) => {
        const articleName = req.params.name;

        //find articleName in your collection/db
        const articleInfo = await db.collection('articles').findOne({name: articleName});

        //make the upvote count
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes + 1
            },
        });

        //create an updated field of the upvote => articleInfo
        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});

        //return it to client
        res.status(200).json(updatedArticleInfo);
        
    }, res);
    
});

//Add comments section refactored
app.post('/api/articles/:name/add-comment',(req, res) => {
    const {username, text} = req.body;
    const articleName = req.params.name;

    withDB( async(db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });

        //make comments stick to db
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text }),
            },
        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);
    }, res);

});

// Before refactor (initial code block) Get articleInfo
// app.get('/api/articles/:name', async (req,res) => {
//     try {
//         const articleName = req.params.name;

//         const client = await MongoClient.connect('mongodb://localhost:27017');
//         const db = client.db('my-blog');
    
//         //from the url you can find the articleName on the db
//         const articleInfo = await db.collection('articles').findOne({ name: articleName });
//         res.status(200).json(articleInfo);
    
//         await client.close();

//     } catch (error) {
//         res.status(500).json({ message: 'sss Error connecting to DB', error });
//     }
    
// });

//Before refactor upvote section
// app.post('/api/articles/:name/upvote', async (req, res) => {
//     try {
        
//         const articleName = req.params.name;

//         //connecting to mongoDB
//         const client = await MongoClient.connect('mongodb://localhost:27017');
//         const db = client.db('my-blog');

//         //find articleName in your collection/db
//         const articleInfo = await db.collection('articles').findOne({name: articleName});

//         //make the upvote count
//         await db.collection('articles').updateOne({ name: articleName }, {
//             '$set': {
//                 upvotes: articleInfo.upvotes + 1
//             },
//         });

//         //create an updated field of the upvote => articleInfo
//         const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});

//         //return it to client
//         res.status(200).json(updatedArticleInfo);

//         await client.close();

//     } catch (error) {
//         res.status(500).json({ message: 'sss Error connecting to DB', error });
//     }
    
// });


//Before refactor add comment section NOTE - we have not connected it to MongoDB here
// app.post('/api/articles/:name/add-comment',(req, res) => {
//     const {username, text} = req.body;
//     const articleName = req.params.name;

//     articlesInfo[articleName].comments.push({username, text});

//     res.status(200).send(articlesInfo[articleName]);
// });

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening here on port 8000'));



