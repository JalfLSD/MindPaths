using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Windows.Forms;

namespace Importer
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            // Create words map
            Dictionary<string, int> words = new Dictionary<string, int>();
            string[] lines = File.ReadAllLines(@"c:\temp\words.csv");
            foreach (string line in lines)
            {
                string []fields = line.Split(',');
                try
                {
                    words.Add(fields[1].Trim('"'), int.Parse(fields[0].Trim('"')));
                }
                catch
                {
                    // do nothing
                }
            }

            // Process the lines
            StringBuilder result = new StringBuilder();
            StringBuilder missing = new StringBuilder();
            lines = File.ReadAllLines(@"c:\temp\NewPairs.txt");
            foreach (string line in lines)
            {
                string[] fields = line.Split(' ');
                if (!string.IsNullOrEmpty(line))
                {
                    int id1 = -1;
                    int id2 = -1;
                
                    if (words.ContainsKey(fields[0]))
                        id1 = words[fields[0]];
                    else missing.AppendLine(fields[0]);
                 
                    if (words.ContainsKey(fields[1]))
                        id2 = words[fields[1]];
                    else missing.AppendLine(fields[1]);

                    if (id1!=-1 && id2!=-1)
                        result.Append(string.Format("({0},{1}),", id1, id2));    
                }
            }

            File.WriteAllText(@"c:\temp\saida.txt",result.ToString());
            File.WriteAllText(@"c:\temp\missing.txt", missing.ToString());
            MessageBox.Show("Done");
        }
    }
}
