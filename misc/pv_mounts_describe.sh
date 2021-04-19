#!/bin/sh
outdir="./described"
tmp1=${outdir}/mounted.pods
tmp2=${outdir}/current_pods.all
out1=${outdir}/pods.log
out2=${outdir}/NS-Pod-Status-Node.log
PStatus="Running" #Printable status
mkdir -p ${outdir}
kubectl describe pvc -A | awk '{if($1~/Name:$/)n=$2;if($1~/Mounted/)print n,$0}' > ${tmp1}
kubectl get po -A -o wide > ${tmp2}
(awk '{print $4}' ${tmp1} | while read p;do awk -vP=$p '$2==P' ${tmp2};done;) > ${out1}
awk 'BEGIN{OFS="\t"}{print $1,$2,$4,$8}' ${out1} > ${out2}
echo "Mounted pods counts:"
awk -vS=${PStatus} '{if($3==S){print $4,$2}}' ${out2} | sort -k1,1 | uniq -c
echo "Mounted node counts:"
awk -vS=${PStatus} '{if($3==S){print $4}}' ${out2} | sort | uniq -c
echo
echo "outputed file '${out1}', '${out2}"
