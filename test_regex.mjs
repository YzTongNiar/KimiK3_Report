let s='A=\\operatorname{Tril}((Q\\odot Q_F)(K/K)^\\top\\rightarrow p)';
console.log(s); console.log(s.replace(/\\operatorname\{([^}]*)\}/g,'$1'));
