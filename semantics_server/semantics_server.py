import os
import random
import sys
import pbclient
import mysql.connector
from flask import Flask,make_response, render_template
app = Flask(__name__)

#####################
#internal methods ##
#####################
def get_connection():
    cnx = mysql.connector.connect(user='root', password='',
                                host='localhost',
                                database='semantics');

    return cnx;

def contents(filename):
    return file(filename).read()
    
def getWord(wordId):
    #get words from id
    try:
        cnx = get_connection();
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            return "Something is wrong your username or password";
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
                return "Database does not exists";
        else:
            return err;
    else:
        #Get Data
        cursor = cnx.cursor();
        cursor.execute("SELECT word FROM words WHERE id=" + str(wordId));
        word = cursor.fetchall();     
        if (len(word) > 0):
            result = word[0][0];
        cursor.close();
        return result

######################
# web services #######
######################
@app.route('/status')
def check_connection():
    #get try the database connection
    try:
        cnx = get_connection();
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            return "Something is wrong your username or password";
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
                return "Database does not exists";
        else:
            return err;
    else:
        #Get Data
        cursor = cnx.cursor();
        query = ("SELECT count(*) FROM words");
        cursor.execute(query);
        rows = cursor.fetchall();
        
        cursor.close();
        cnx.close();
        return "database ok!"

@app.route('/links/<word>')
def linkWords(word):
    #get words related to another word    
    try:
        cnx = get_connection();
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            return "Something is wrong your username or password";
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
                return "Database does not exists";
        else:
            return err;
    else:
        #Get Data
        cursor = cnx.cursor();
        cursor.execute("SELECT id2,weight FROM links WHERE id1=" + str(word));
        words = cursor.fetchall();        
        cursor.close();
        cnx.close();
        
        print(words)

        if (len(words)>0):            
            result = str(len(words));
            for item in words:
                weight = 10+item[1] * 50;
                result = result + '~'+str(item[0])+'~'+str(weight)+'~'+getWord(item[0]);

        #build result
        resp = make_response(result);
        resp.cache_control.no_cache = True
        resp.headers.add('Access-Control-Allow-Origin', '*')
        return resp

@app.route('/setup')
def setup():    
    # settings
    pbclient.set('api_key', "c008cbd5-7885-4c49-a0fe-6cdee926651f")
    pbclient.set('endpoint', 'http://localhost/pybossa')

    # Create the app
    #pbclient.create_app('Semantics Map','Semantics','What is the perceived relation between words? ');
    dir = os.path.dirname(__file__)
        
    #update app
    pyBossaApp = pbclient.find_app(short_name='Semantics')[0]
    pyBossaApp.long_description = contents(dir + '/../View/long_description.html')
    pyBossaApp.info['task_presenter'] = contents(dir + '/../View/template.html')
    pyBossaApp.info['thumbnail'] = "http://societic.ibercivis.es/semantics/static/images/icon.jpg"
    #pyBossaApp.info['tutorial'] = contents('tutorial.html')
    pyBossaApp.category_id = 1
    pbclient.update_app(pyBossaApp)

    #create tasks
    try:
        cnx = get_connection()
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            return "Something is wrong your username or password"
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
                return "Database does not exists"
        else:
            return err;
    else:
        #Get Data
        cursor = cnx.cursor()
        cursor.execute("SELECT * FROM startwords")
        words = cursor.fetchall()        
        cursor.close()
        cnx.close()

        #if (len(words)>0):            
        #    for item in words:
        #            task_info = dict(start=item[0],
        #                end=item[1],
        #                startWord=getWord(item[0]),
        #                endWord=getWord(item[1]) )
        #            pbclient.create_task(pyBossaApp.id, task_info)
        
    return "ok"

if __name__ == '__main__':
    app.run()